/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { app, BrowserWindow, dialog, ipcMain, Menu, MouseInputEvent, Tray } from 'electron';
import { preferredLanguage, selectPreferredLanguage, translate } from 'typed-intl';
import electronConnect from 'electron-connect';
import { CardIO } from './modules_main/io';
import { DialogButton } from './modules_common/const';
import { CardProp, CardPropSerializable } from './modules_common/cardprop';
import {
  English,
  getCurrentMessages,
  Japanese,
  MESSAGE,
  MessageLabel,
  setCurrentMessages,
} from './modules_common/i18n';
import {
  Card,
  cards,
  deleteCard,
  setGlobalFocusEventListenerPermission,
} from './modules_main/card';
import { settings } from './modules_common/settings';

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

const translations = translate(English).supporting('ja', Japanese);

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
        throw new Error('The card is not registered in cards: ' + prop.id);
      }
    })
    .catch((e: Error) => {
      console.debug(e.message);
    });
});

ipcMain.handle('delete-card', async (event, id: string) => {
  await deleteCard(id);
});

ipcMain.handle('finish-render-card', (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    card.renderingCompleted = true;
  }
});

ipcMain.handle('create-card', (event, propObject: CardPropSerializable) => {
  const prop = CardProp.fromObject(propObject);
  const card = new Card('New', prop);
  cards.set(card.prop.id, card);
  card.render();
  return card.prop.id;
});

const openSettings = () => {
  const settingWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
    },
    width: 800,
    height: 360,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/media_stickies_grad_icon.ico'),
  });

  // hot reload
  if (process.env.NODE_ENV === 'development') {
    electronConnect.client.create(settingWindow);
    settingWindow.webContents.openDevTools();
  }

  settingWindow.loadURL(path.join(__dirname, 'settings/settings.html'));
};
/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', async () => {
  // locale can be got after 'ready'
  console.debug('locale: ' + app.getLocale());
  selectPreferredLanguage(['en', 'ja'], [app.getLocale(), 'en']);
  setCurrentMessages((preferredLanguage() as unknown) as string, translations.messages());

  // for debug
  if (process.env.NODE_ENV === 'development') {
    openSettings();
  }

  const tray = new Tray(path.join(__dirname, '../assets/media_stickies_grad_icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: MESSAGE('settings'),
      click: () => {
        openSettings();
      },
    },
    {
      label: MESSAGE('exit'),
      click: () => {
        cards.forEach((card, key) => card.window.webContents.send('card-close'));
      },
    },
  ]);
  tray.setToolTip(MESSAGE('trayToolTip'));
  tray.setContextMenu(contextMenu);

  // load cards
  const cardArray: Card[] = await CardIO.getCardIdList()
    .then((arr: string[]) => {
      const cardArr = [];
      if (arr.length === 0) {
        // Create a new card
        const card = new Card('New');
        cardArr.push(card);
      }
      else {
        for (const id of arr) {
          const card = new Card('Load', id);
          cardArr.push(card);
        }
      }
      return cardArr;
    })
    .catch((e: Error) => {
      console.error(`Cannot load a list of cards: ${e.message}`);
      return [];
    });

  const renderers = [];
  for (const card of cardArray) {
    cards.set(card.prop.id, card);
    renderers.push(card.render());
  }

  await Promise.all(renderers).catch((e: Error) => {
    console.error(`Error while rendering cards in ready event: ${e.message}`);
  });

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
    const card = cards.get(key);
    if (card) {
      if (!card.window.isDestroyed()) {
        card.window.moveTop();
      }
    }
  }
  console.debug(`Completed to load ${renderers.length} cards`);
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

ipcMain.handle('blur-and-focus-with-suppress-events', (event, id: string) => {
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

ipcMain.handle('blur-and-focus-with-suppress-focus-event', (event, id: string) => {
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

ipcMain.handle('alert-dialog', (event, id: string, label: MessageLabel) => {
  const card = cards.get(id);
  if (!card) {
    return;
  }

  dialog.showMessageBoxSync(card.window, {
    type: 'question',
    buttons: ['OK'],
    message: MESSAGE(label),
  });
});

ipcMain.handle(
  'confirm-dialog',
  (event, id: string, buttonLabels: MessageLabel[], label: MessageLabel) => {
    const card = cards.get(id);
    if (!card) {
      return;
    }
    const buttons: string[] = buttonLabels.map(buttonLabel => MESSAGE(buttonLabel));
    return dialog.showMessageBoxSync(card.window, {
      type: 'question',
      buttons: buttons,
      defaultId: DialogButton.Default,
      cancelId: DialogButton.Cancel,
      message: MESSAGE(label),
    });
  }
);

ipcMain.handle('set-window-size', (event, id: string, width: number, height: number) => {
  const card = cards.get(id);
  // eslint-disable-next-line no-unused-expressions
  card?.window.setSize(width, height);
});

ipcMain.handle('get-uuid', () => {
  return uuidv4();
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

ipcMain.handle(
  'send-mouse-input',
  (event, id: string, mouseInputEvent: MouseInputEvent) => {
    const targetCard = cards.get(id);
    if (!targetCard) {
      return;
    }
    targetCard.window.webContents.sendInputEvent(mouseInputEvent);
  }
);

ipcMain.handle('get-i18n', () => {
  return getCurrentMessages();
});

ipcMain.handle('get-settings', () => {
  return settings;
});
