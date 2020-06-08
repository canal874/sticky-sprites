/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import path from 'path';
import uniqid from 'uniqid';
import { BrowserWindow, ipcMain, shell } from 'electron';
import {
  CardDate,
  CardProp,
  CardPropSerializable,
  CardStyle,
  Rectangle,
} from '../modules_common/cardprop';
import { CardIO } from '../modules_ext/io';
import { logger } from '../modules_common/utils';
import {
  getGlobalFocusEventListenerPermission,
  setGlobalFocusEventListenerPermission,
} from './global';

/**
 * Const
 */
const minimumWindowWidth = 30;

/**
 * Card
 * A small sticky windows is called 'card'.
 */
const generateNewCardId = (): string => {
  // returns 18 byte unique characters
  return uniqid();
};

export const cards: Map<string, Card> = new Map<string, Card>();

export class Card {
  public prop!: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;

  public suppressFocusEventOnce = false;
  public suppressBlurEventOnce = false;

  public loadOrCreateCardData: () => Promise<CardProp>;
  constructor (public id: string = '', public propTemplate?: CardPropSerializable) {
    this.loadOrCreateCardData = this._loadCardData;
    if (this.id === '') {
      this.id = generateNewCardId();
      this.loadOrCreateCardData = this._createCardData;
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

      icon: path.join(__dirname, '../assets/media_stickies_grad_icon.ico'),
    });
    this.window.setMaxListeners(20);

    // Open hyperlink on external browser window
    // by preventing to open it on new electron window
    // when target='_blank' is set.
    this.window.webContents.on('new-window', (event, _url) => {
      event.preventDefault();
      shell.openExternal(_url);
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

    this.window.on('focus', this._focusListener);
    this.window.on('blur', this._blurListener);
  }

  public render = () => {
    return Promise.all([this._readyToShow(), this._loadHTML(), this.loadOrCreateCardData()])
      .then(([, , _prop]) => {
        this.prop = _prop;
        this._renderCard(_prop);
      })
      .catch((e: Error) => {
        throw new Error(`Cannot load card: ${this.id}: ${e.message}`);
      });
  };

  private _renderCard (_prop: CardProp): void {
    this.window.setSize(_prop.rect.width, _prop.rect.height);
    this.window.setPosition(_prop.rect.x, _prop.rect.y);
    logger.debug(`renderCard in main: ${JSON.stringify(_prop.toObject())}`);
    this.window.webContents.send('render-card', _prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
    this.window.showInactive();
  }

  private _readyToShow: () => Promise<void> = () => {
    return new Promise(resolve => {
      this.window.once('ready-to-show', () => {
        // logger.debug('readyToShow ' + this.id);
        resolve();
      });
    });
  };

  private _finishReloadListener = (event: Electron.IpcMainEvent, fromId: string) => {
    if (fromId === this.id) {
      console.log(`reloaded in main: ${this.prop.id}`);
      this.window.webContents.send('render-card', this.prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
    }
  };

  private _loadHTML: () => Promise<void> = () => {
    return new Promise((resolve, reject) => {
      const finishLoadListener = (event: Electron.IpcMainEvent, fromId: string) => {
        if (fromId === this.id) {
          // logger.debug('loadHTML  ' + fromId);

          // Don't use 'did-finish-load' event.
          // loadHTML resolves after loading HTML and processing required script are finished.
          //     this.window.webContents.on('did-finish-load', () => {
          ipcMain.off('finish-load', finishLoadListener);
          ipcMain.on('finish-load', this._finishReloadListener);
          resolve();
        }
      };
      ipcMain.on('finish-load', finishLoadListener);
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
            id: this.id,
          },
        })
      );
    });
  };

  // eslint-disable-next-line complexity
  private _createCardData: () => Promise<CardProp> = () => {
    if (this.propTemplate) {
      const _prop = this.propTemplate;
      const rect: Rectangle | undefined =
        _prop.x === undefined ||
        _prop.y === undefined ||
        _prop.width === undefined ||
        _prop.height === undefined
          ? undefined
          : { x: _prop.x, y: _prop.y, width: _prop.width, height: _prop.height };
      const style: CardStyle | undefined =
        _prop.titleColor === undefined ||
        _prop.backgroundColor === undefined ||
        _prop.backgroundOpacity === undefined
          ? undefined
          : {
            titleColor: _prop.titleColor,
            backgroundColor: _prop.backgroundColor,
            backgroundOpacity: _prop.backgroundOpacity,
          };
      const date: CardDate | undefined =
        _prop.createdDate === undefined || _prop.modifiedDate === undefined
          ? undefined
          : {
            createdDate: _prop.createdDate,
            modifiedDate: _prop.modifiedDate,
          };
      return Promise.resolve(new CardProp(this.id, _prop.data, rect, style, date));
    }

    return Promise.resolve(new CardProp(this.id));
  };

  private _loadCardData: () => Promise<CardProp> = () => {
    return new Promise((resolve, reject) => {
      CardIO.readCardData(this.id)
        .then((_prop: CardProp) => {
          // logger.debug('loadCardData  ' + this.id);
          resolve(_prop);
        })
        .catch((e: Error) => {
          reject(new Error(`Error in loadCardData: ${e.message}`));
        });
    });
  };

  private _focusListener = () => {
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

  private _blurListener = () => {
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
