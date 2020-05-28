/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { CardProp } from '../modules_common/cardprop';
import { BrowserWindow, shell, ipcMain } from 'electron';
import { CardIO } from '../modules_ext/io';
import { logger } from '../modules_common/utils';
import url from 'url';
import path from 'path';
import {
  setGlobalFocusEventListenerPermission,
  getGlobalFocusEventListenerPermission,
} from './global';

/**
 * Const
 */
const minimumWindowWidth = 30;

/**
 * Card
 * A small sticky windows is called 'card'.
 */
export const cards: Map<string, Card> = new Map<string, Card>();

export class Card {
  public prop!: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;

  public suppressFocusEventOnce = false;
  public suppressBlurEventOnce = false;

  public loadOrCreateCardData: () => Promise<CardProp>;
  constructor (public id: string = '') {
    this.loadOrCreateCardData = this.loadCardData;
    if (this.id == '') {
      this.id = CardIO.generateNewCardId();
      this.loadOrCreateCardData = this.createCardData;
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
  }

  public render = () => {
    return Promise.all([
      this.readyToShow(),
      this.loadHTML(),
      this.loadOrCreateCardData(),
    ])
      .then(([, , _prop]) => {
        this.prop = _prop;
        this.renderCard();
      })
      .catch(error => {
        throw `Cannot load card: ${this.id}: ${error}`;
      });
  };

  private renderCard (): void {
    this.window.setSize(this.prop.rect.width, this.prop.rect.height);
    this.window.setPosition(this.prop.rect.x, this.prop.rect.y);
    logger.debug('renderCard in main:' + JSON.stringify(this.prop.toObject()));
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
      this.window.webContents.on(
        'did-fail-load',
        (event, errorCode, errorDescription, validatedURL) => {
          reject(`Error in loadHTML: ${validatedURL} ${errorDescription}`);
        }
      );
      this.window.loadURL(
        url.format({
          pathname: path.join(__dirname, '../index.html'),
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
          reject(`Error in loadCardData: ${err}`);
        });
    });
  };

  private focusListener = () => {
    if (this.suppressFocusEventOnce) {
      logger.debug(`skip focus event listener ${this.id}`);
      this.suppressFocusEventOnce = false;
      setGlobalFocusEventListenerPermission(true);
    }
    else if (!getGlobalFocusEventListenerPermission()) {
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
