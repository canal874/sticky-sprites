/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import {
  CardDate,
  CardProp,
  CardPropSerializable,
  CardStyle,
  Geometry,
} from '../modules_common/cardprop';
import { CardIO } from '../modules_ext/io';
import { getCurrentDateAndTime } from '../modules_common/utils';
import { logger } from '../modules_common/logger';
import { CardInitializeType } from '../modules_common/types';

/**
 * Const
 */
const MINIMUM_WINDOW_WIDTH = 180;
const MINIMUM_WINDOW_HEIGHT = 80;

/**
 * Focus control
 */
let globalFocusListenerPermission = true;
/**
 * Set permission to call focus event listener in all renderer processes.
 */
export const setGlobalFocusEventListenerPermission = (
  canExecuteFocusEventListener: boolean
) => {
  globalFocusListenerPermission = canExecuteFocusEventListener;
};

export const getGlobalFocusEventListenerPermission = () => {
  return globalFocusListenerPermission;
};

/**
 * Card
 * A small sticky windows is called 'card'.
 */
const generateNewCardId = (): string => {
  // YYYY-MM-DD-UUID4
  return `${getCurrentDateAndTime().replace(/^(.+?)\s.+?$/, '$1')}-${uuidv4()}`;
};

export const cards: Map<string, Card> = new Map<string, Card>();

export class Card {
  public prop: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;

  public suppressFocusEventOnce = false;
  public suppressBlurEventOnce = false;
  public recaptureGlobalFocusEventAfterLocalFocusEvent = false;

  public renderingCompleted = false;

  private _loadOrCreateCardData: () => Promise<void>;

  constructor (public cardInitializeType: CardInitializeType, arg?: CardProp | string) {
    if (cardInitializeType === 'New') {
      this._loadOrCreateCardData = () => {
        return Promise.resolve();
      };
      if (arg === undefined) {
        // Create card with default properties
        this.prop = new CardProp(generateNewCardId());
      }
      else if (arg instanceof CardProp) {
        // Create card with specified CardProp
        if (arg.id === '') {
          arg.id = generateNewCardId();
        }
        this.prop = arg;
      }
      else {
        throw new TypeError('Second parameter must be CardProp when creating new card.');
      }
    }
    else {
      // cardInitializeType === 'Load'
      // Load Card
      if (typeof arg !== 'string') {
        throw new TypeError('Second parameter must be id string when loading the card.');
      }
      const id = arg;
      this.prop = new CardProp(id);

      this._loadOrCreateCardData = () => {
        return new Promise((resolve, reject) => {
          CardIO.readCardData(id, this.prop)
            .then(() => {
              // logger.debug('loadCardData  ' + arg);
              resolve();
            })
            .catch((e: Error) => {
              reject(new Error(`Error in loadCardData: ${e.message}`));
            });
        });
      };
    }

    this.window = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, '../modules_renderer/preload.js'),
        //        contextIsolation: true,
      },
      minWidth: MINIMUM_WINDOW_WIDTH,
      minHeight: MINIMUM_WINDOW_HEIGHT,

      transparent: true,
      frame: false,
      show: false,

      maximizable: false,
      fullscreenable: false,

      icon: path.join(__dirname, '../assets/media_stickies_grad_icon.ico'),
    });
    this.window.setMaxListeners(20);

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
      cards.delete(this.prop.id);
    });

    // Open hyperlink on external browser window
    // by preventing to open it on new electron window
    // when target='_blank' is set.
    this.window.webContents.on('new-window', (e, _url) => {
      e.preventDefault();
      shell.openExternal(_url);
    });

    this.window.on('focus', this._focusListener);
    this.window.on('blur', this._blurListener);
  }

  public render = () => {
    return Promise.all([this._loadOrCreateCardData(), this._loadHTML()])
      .then(() => {
        this._renderCard(this.prop);
      })
      .catch(e => {
        throw new Error(`Error in render(): ${e.message}`);
      });
  };

  _renderCard = (_prop: CardProp) => {
    return new Promise(resolve => {
      this.window.setSize(_prop.geometry.width, _prop.geometry.height);
      this.window.setPosition(_prop.geometry.x, _prop.geometry.y);
      // logger.debug(`renderCard in main: ${JSON.stringify(_prop.toObject())}`);
      logger.debug(`renderCard in main [${_prop.id}] ${_prop.data.substr(0, 40)}`);
      this.window.showInactive();
      this.window.webContents.send('render-card', _prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
      const checkTimer = setInterval(() => {
        if (this.renderingCompleted) {
          clearInterval(checkTimer);
          resolve();
        }
      }, 200);
    });
  };

  private _finishReloadListener = (event: Electron.IpcMainEvent) => {
    console.log(`reloaded in main: ${this.prop.id}`);
    this.window.webContents.send('render-card', this.prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
  };

  private _loadHTML: () => Promise<void> = () => {
    return new Promise((resolve, reject) => {
      const finishLoadListener = (event: Electron.IpcMainEvent) => {
        // logger.debug('loadHTML  ' + fromId);

        // Don't use 'did-finish-load' event.
        // loadHTML resolves after loading HTML and processing required script are finished.
        //     this.window.webContents.on('did-finish-load', () => {
        ipcMain.off('finish-load-' + this.prop.id, finishLoadListener);
        ipcMain.on('finish-load-', this._finishReloadListener);
        resolve();
      };
      ipcMain.on('finish-load-' + this.prop.id, finishLoadListener);

      this.window.webContents.on(
        'did-fail-load',
        (event, errorCode, errorDescription, validatedURL) => {
          reject(new Error(`Error in loadHTML: ${validatedURL} ${errorDescription}`));
        }
      );
      this.window.loadURL(
        url.format({
          pathname: path.join(__dirname, '../index.html'),
          protocol: 'file:',
          slashes: true,
          query: {
            id: this.prop.id,
          },
        })
      );
    });
  };

  // @ts-ignore
  private _focusListener = e => {
    if (this.recaptureGlobalFocusEventAfterLocalFocusEvent) {
      this.recaptureGlobalFocusEventAfterLocalFocusEvent = false;
      setGlobalFocusEventListenerPermission(true);
    }
    if (this.suppressFocusEventOnce) {
      logger.debug(`skip focus event listener ${this.prop.id}`);
      this.suppressFocusEventOnce = false;
    }
    else if (!getGlobalFocusEventListenerPermission()) {
      logger.debug(`focus event listener is suppressed ${this.prop.id}`);
    }
    else {
      logger.debug(`focus ${this.prop.id}`);
      this.window.webContents.send('card-focused');
    }
  };

  private _blurListener = () => {
    if (this.suppressBlurEventOnce) {
      logger.debug(`skip blur event listener ${this.prop.id}`);
      this.suppressBlurEventOnce = false;
    }
    else {
      logger.debug(`blur ${this.prop.id}`);
      this.window.webContents.send('card-blurred');
    }
  };
}
