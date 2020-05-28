/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { selectPreferredLanguage } from 'typed-intl';
import { logger } from './modules_common/utils';
import url from 'url';
import path from 'path';
import translations from './modules_common/base.msg';
import { CardProp, CardPropSerializable } from './modules_common/card';
import { CardIO } from './modules_ext/io';
//import { sleep } from './modules_common/utils';

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
export let MESSAGE: Object = {};

/**
 * Const
 */
const minimumWindowWidth = 30;

/**
 * Card
 * A small sticky windows is called 'card'.
 */

const cards: Map<string, Card> = new Map<string, Card>();

class Card {
  public prop!: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;

  public suppressFocusEventOnce = false;
  public suppressBlurEventOnce = false;

  constructor (public id: string = '') {
    let loadOrCreateCardData = this.loadCardData;
    if (this.id == '') {
      this.id = CardIO.generateNewCardId();
      loadOrCreateCardData = this.createCardData;
    }

    this.window = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
      },
      minWidth: minimumWindowWidth,
      transparent: true,
      frame: false,
      show: false,

      maximizable: false,
      fullscreenable: false,

      // Set window title to card id.
      // This enables some tricks that can access the card window from other apps.
      title: id,
    });
    this.window.setMaxListeners(20);

    // Open hyperlink on external browser window
    // by preventing to open it on new electron window
    // when target='_blank' is set.
    this.window.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    // Resized by hand
    // will-resize is only emitted when the window is being resized manually.
    // Resizing the window with setBounds/setSize will not emit this event.
    this.window.on('will-resize', (event, newBounds) => {
      this.window.webContents.send('resize-by-hand', newBounds);
    });

    // Moved by hand
    this.window.on('will-move', (event, newBounds) => {
      this.window.webContents.send('move-by-hand', newBounds);
    });

    this.window.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      cards.delete(this.id);
    });

    this.window.on('focus', this.focusListener);
    this.window.on('blur', this.blurListener);

    Promise.all([this.readyToShow(), this.loadHTML(), loadOrCreateCardData()])
      .then(([, , _prop]) => {
        this.prop = _prop;
        this.renderCard();
      })
      .catch(() => {
        throw 'Cannot load card';
      });
  }

  private renderCard (): void {
    this.window.setSize(this.prop.rect.width, this.prop.rect.height);
    this.window.setPosition(this.prop.rect.x, this.prop.rect.y);
    logger.debug('load:' + JSON.stringify(this.prop.toObject()));
    this.window.webContents.send('render-card', this.prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
    this.window.showInactive();
  }

  private readyToShow: () => Promise<void> = () => {
    return new Promise(resolve => {
      this.window.once('ready-to-show', () => {
        resolve();
      });
    });
  };

  private loadHTML: () => Promise<void> = () => {
    return new Promise((resolve, reject) => {
      ipcMain.once('finish-load', () => {
        // Don't use 'did-finish-load' event.
        // loadHTML resolves after loading HTML and processing required script are finished.
        //     this.window.webContents.on('did-finish-load', () => {
        resolve();
      });
      this.window.webContents.on('did-fail-load', () => {
        reject();
      });
      this.window.loadURL(
        url.format({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file:',
          slashes: true,
        })
      );
    });
  };

  private createCardData: () => Promise<CardProp> = () => {
    return Promise.resolve(new CardProp(this.id));
  };

  private loadCardData: () => Promise<CardProp> = () => {
    return new Promise((resolve, reject) => {
      CardIO.readCardData(this.id)
        .then((_prop: CardProp) => {
          resolve(_prop);
        })
        .catch((err: string) => {
          logger.error('Load card error: ' + this.id + ', ' + err);
          reject();
        });
    });
  };

  private focusListener = () => {
    if (this.suppressFocusEventOnce) {
      logger.debug(`skip focus event listener ${this.id}`);
      this.suppressFocusEventOnce = false;
      suppressGlobalFocusEvent = false;
    }
    else if (suppressGlobalFocusEvent) {
      logger.debug(`focus event listener is suppressed ${this.id}`);
    }
    else {
      logger.debug(`focus ${this.id}`);
      this.window.webContents.send('card-focused');
    }
  };

  private blurListener = () => {
    if (this.suppressBlurEventOnce) {
      logger.debug(`skip blur event listener ${this.id}`);
      this.suppressBlurEventOnce = false;
    }
    else {
      logger.debug(`blur ${this.id}`);
      this.window.webContents.send('card-blurred');
    }
  };
}

app.on('window-all-closed', () => {
  app.quit();
});

/**
 * Card I/O
 */

ipcMain.handle('save', async (event, cardPropObj: CardPropSerializable) => {
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
        throw 'The card is not registered in cards.';
      }
    })
    .catch((err: string) => {
      logger.debug(err);
    });
});

export const deleteCard = (prop: CardProp) => {
  CardIO.deleteCardData(prop.id)
    .catch((err: string) => {
      logger.error(err);
    })
    .then(() => {
      logger.debug('deleted :' + prop.id);
      cards.get(prop.id)?.window.webContents.send('card-close');
    });
};

export const createCard = () => {
  const card = new Card();
  cards.set(card.id, card);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // locale can be got after 'ready'
  logger.debug('locale: ' + app.getLocale());
  selectPreferredLanguage(['en', 'ja'], [app.getLocale(), 'en']);
  MESSAGE = translations.messages();

  // load cards
  CardIO.getCardIdList()
    .then((arr: Array<string>) => {
      if (arr.length == 0) {
        // Create a new card
        const card = new Card();
        cards.set(card.id, card);
      }
      else {
        for (let id of arr) {
          try {
            cards.set(id, new Card(id));
          } catch (e) {
            throw `Cannot create a Card instance of ${id}: ${e}`;
            logger.error(e);
          }
        }
      }
    })
    .catch((err: string) => {
      logger.error(`Cannot load a list of cards: ${err}`);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
export const setWindowSize = (id: string, width: number, height: number) => {
  const card = cards.get(id);
  card?.window.setSize(width, height);
};

let suppressGlobalFocusEvent = false;

ipcMain.handle('blurAndFocus', async (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`blurAndFocus: ${id}`);
    /**
     * When a card is blurred, another card will be focused automatically by OS.
     * Set suppressGlobalFocusEvent to suppress to focus another card.
     */
    suppressGlobalFocusEvent = true;
    card.suppressBlurEventOnce = true;
    card.window.blur();
    card.suppressFocusEventOnce = true;
    card.window.focus();
  }
});
