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
import translations from './modules_common/base.msg';
import { CardProp, CardPropSerializable } from './modules_common/cardprop';
import { CardIO } from './modules_ext/io';
import { Card, cards } from './modules_main/card';
import { setGlobalFocusEventListenerPermission } from './modules_main/global';
// import { sleep } from './modules_common/utils';

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
ipcMain.handle('save', (event, cardPropObj: CardPropSerializable) => {
  const prop = CardProp.fromObject(cardPropObj);

  // for debug
  // await sleep(10000);

  CardIO.writeOrCreateCardData(prop)
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

ipcMain.handle('delete-card', (event, id: string) => {
  CardIO.deleteCardData(id)
    .catch((e: Error) => {
      logger.error(e.message);
    })
    .then(() => {
      logger.debug('deleted :' + id);
      // eslint-disable-next-line no-unused-expressions
      cards.get(id)?.window.webContents.send('card-close');
    })
    .catch((e: Error) => {
      logger.error(e.message);
    });
});

ipcMain.handle('create-card', () => {
  const card = new Card();
  card
    .render()
    .then(() => {
      cards.set(card.id, card);
    })
    .catch((e: Error) => {
      logger.error(`Error in createCard(): ${e.message}`);
    });
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

  for (const card of cardArray) {
    card
      .render()
      .then(() => {
        cards.set(card.id, card);
      })
      .catch((e: Error) => {
        logger.error(`Error while loading card in ready event: ${e.message}`);
      });
  }
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

ipcMain.handle('blurAndFocus', (event, id: string) => {
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
    card.window.focus();
  }
});

ipcMain.handle('alert-dialog', (event, id: string, msg: string) => {
  const card = cards.get(id);
  if (!card) {
    return;
  }

  dialog
    .showMessageBox(card.window, {
      type: 'question',
      buttons: ['OK'],
      message: msg,
    })
    .then(() => {})
    .catch(() => {});
});

ipcMain.handle('set-window-size', (event, id: string, width: number, height: number) => {
  const card = cards.get(id);
  // eslint-disable-next-line no-unused-expressions
  card?.window.setSize(width, height);
});
