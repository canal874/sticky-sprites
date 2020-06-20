/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { app, dialog, ipcMain } from 'electron';
import { selectPreferredLanguage } from 'typed-intl';
import { logger } from './modules_common/utils';
import translations from './modules_common/i18n';
import { DialogButton } from './modules_common/const';
import { CardProp, CardPropSerializable } from './modules_common/cardprop';
import { CardIO } from './modules_ext/io';
import { Card, cards, setGlobalFocusEventListenerPermission } from './modules_main/card';

// process.on('unhandledRejection', console.dir);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// Increase max listeners
ipcMain.setMaxListeners(1000);

/**
 * i18n
 */
export const i18n = translations;
ipcMain.handle('get-messages', () => {
  return i18n.messages();
});
/**
 * Card I/O
 */
ipcMain.handle('save-card', async (event, cardPropObj: CardPropSerializable) => {
  const prop = CardProp.fromObject(cardPropObj);

  await CardIO.writeOrCreateCardData(prop)
    .then(() => {
      const card = cards.get(prop.id);
      if (card) {
        card.prop = prop;
      }
      else {
        throw new Error('The card is not registered in cards.');
      }
    })
    .catch((e: Error) => {
      logger.debug(e.message);
    });
});

ipcMain.handle('delete-card', async (event, id: string) => {
  await CardIO.deleteCardData(id)
    .catch((e: Error) => {
      logger.error(`delete-card: ${e.message}`);
    })
    .then(() => {
      logger.debug(`deleted : ${id}`);
      // eslint-disable-next-line no-unused-expressions
      cards.get(id)?.window.webContents.send('card-close');
    })
    .catch((e: Error) => {
      logger.error(`send card-close: ${e.message}`);
    });
});

ipcMain.handle('finish-render-card', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    card.renderingCompleted = true;
  }
});

ipcMain.handle('create-card', async (event, propTemplate: CardPropSerializable) => {
  const card = new Card('', propTemplate);
  cards.set(card.id, card);
  await card.render().catch((e: Error) => {
    logger.error(`Error in createCard(): ${e.message}`);
  });
  return card.id;
});

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', async () => {
  // locale can be got after 'ready'
  logger.debug('locale: ' + app.getLocale());
  selectPreferredLanguage(['en', 'ja'], [app.getLocale(), 'en']);

  // load cards
  const cardArray: Card[] = await CardIO.getCardIdList()
    .then((arr: string[]) => {
      const cardArr = [];
      if (arr.length === 0) {
        // Create a new card
        const card = new Card();
        cardArr.push(card);
      }
      else {
        for (const id of arr) {
          const card = new Card(id);
          cardArr.push(card);
        }
      }
      return cardArr;
    })
    .catch((e: Error) => {
      logger.error(`Cannot load a list of cards: ${e.message}`);
      return [];
    });

  const renderers = [];
  for (const card of cardArray) {
    cards.set(card.id, card);
    renderers.push(
      card.render().catch((e: Error) => {
        logger.error(`Error while loading card in ready event: ${e.message}`);
      })
    );
  }
  Promise.all(renderers)
    .then(() => {
      logger.debug('All cards are rendered.');
      const backToFront = [...cards.keys()].sort((a, b) => {
        if (cards.get(a)!.prop.geometry.z < cards.get(b)!.prop.geometry.z) {
          return -1;
        }
        else if (cards.get(a)!.prop.geometry.z > cards.get(b)!.prop.geometry.z) {
          return 1;
        }
        return 0;
      });

      for (const key of backToFront) {
        cards.get(key)!.window.moveTop();
      }
    })
    .catch((e: Error) => {
      logger.error(`Error while rendering cards in ready event: ${e.message}`);
    });
});

/**
 * Exit app
 */
app.on('window-all-closed', () => {
  app.quit();
});

/**
 * Utils
 */

ipcMain.handle('blurAndFocusWithSuppressEvents', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`blurAndFocus: ${id}`);
    /**
     * When a card is blurred, another card will be focused automatically by OS.
     * Set suppressGlobalFocusEvent to suppress to focus another card.
     */
    setGlobalFocusEventListenerPermission(false);
    card.suppressBlurEventOnce = true;
    card.window.blur();
    card.suppressFocusEventOnce = true;
    card.recaptureGlobalFocusEventAfterLocalFocusEvent = true;
    card.window.focus();
  }
});

ipcMain.handle('blurAndFocusWithSuppressFocusEvent', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`blurAndFocus: ${id}`);
    /**
     * When a card is blurred, another card will be focused automatically by OS.
     * Set suppressGlobalFocusEvent to suppress to focus another card.
     */
    setGlobalFocusEventListenerPermission(false);
    card.window.blur();
    card.recaptureGlobalFocusEventAfterLocalFocusEvent = true;
    card.window.focus();
  }
});

ipcMain.handle('blur', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`blur: ${id}`);
    card.window.blur();
  }
});

ipcMain.handle('focus', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`focus: ${id}`);
    card.window.focus();
  }
});

ipcMain.handle('set-title', (event, id: string, title: string) => {
  const card = cards.get(id);
  if (card) {
    card.window.setTitle(title);
  }
});

ipcMain.handle('alert-dialog', (event, id: string, msg: string) => {
  const card = cards.get(id);
  if (!card) {
    return;
  }

  dialog.showMessageBoxSync(card.window, {
    type: 'question',
    buttons: ['OK'],
    message: msg,
  });
});

ipcMain.handle('confirm-dialog', (event, id: string, buttons: string[], msg: string) => {
  const card = cards.get(id);
  if (!card) {
    return;
  }
  return dialog.showMessageBoxSync(card.window, {
    type: 'question',
    buttons: buttons,
    defaultId: DialogButton.Default,
    cancelId: DialogButton.Cancel,
    message: msg,
  });
});

ipcMain.handle('set-window-size', (event, id: string, width: number, height: number) => {
  const card = cards.get(id);
  // eslint-disable-next-line no-unused-expressions
  card?.window.setSize(width, height);
});

ipcMain.handle('bring-to-front', (event, id: string, rearrange = false) => {
  const targetCard = cards.get(id);
  if (!targetCard) {
    return;
  }

  const backToFront = [...cards.keys()].sort((a, b) => {
    if (cards.get(a)!.prop.geometry.z < cards.get(b)!.prop.geometry.z) {
      return -1;
    }
    else if (cards.get(a)!.prop.geometry.z > cards.get(b)!.prop.geometry.z) {
      return 1;
    }
    return 0;
  });

  const newZ = cards.get(backToFront[backToFront.length - 1])!.prop.geometry.z + 1;
  targetCard.prop.geometry.z = newZ;
  backToFront.splice(backToFront.indexOf(id), 1);
  backToFront.push(id);

  // NOTE: When bring-to-front is invoked by focus event, the card has been already brought to front.
  if (rearrange) {
    for (const key of backToFront) {
      cards.get(key)!.suppressFocusEventOnce = true;
      cards.get(key)!.window.focus();
    }
  }

  return newZ;
});

ipcMain.handle('send-to-back', (event, id: string) => {
  const targetCard = cards.get(id);
  if (!targetCard) {
    return;
  }

  const backToFront = [...cards.keys()].sort((a, b) => {
    if (cards.get(a)!.prop.geometry.z < cards.get(b)!.prop.geometry.z) {
      return -1;
    }
    else if (cards.get(a)!.prop.geometry.z > cards.get(b)!.prop.geometry.z) {
      return 1;
    }
    return 0;
  });

  const newZ = cards.get(backToFront[0])!.prop.geometry.z - 1;
  targetCard.prop.geometry.z = newZ;
  backToFront.splice(backToFront.indexOf(id), 1);
  backToFront.unshift(id);

  for (const key of backToFront) {
    cards.get(key)!.suppressFocusEventOnce = true;
    cards.get(key)!.window.focus();
  }
  return newZ;
});

ipcMain.handle('send-mouse-input', (event, id: string, x: number, y: number) => {
  const targetCard = cards.get(id);
  if (!targetCard) {
    return;
  }
  targetCard.window.webContents.sendInputEvent({
    type: 'mouseDown',
    x: x,
    y: y,
    button: 'left',
  });
});
