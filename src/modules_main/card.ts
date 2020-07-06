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
import { BrowserWindow, ipcMain, shell } from 'electron';
import {
  CardDate,
  CardProp,
  CardPropSerializable,
  CardStyle,
  Geometry,
} from '../modules_common/cardprop';
import { CardIO } from '../modules_ext/io';
import { getCurrentDate, logger } from '../modules_common/utils';

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
  return `${getCurrentDate()}-${uuidv4()}`;
};

export const cards: Map<string, Card> = new Map<string, Card>();

export class Card {
  public prop!: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;

  public suppressFocusEventOnce = false;
  public suppressBlurEventOnce = false;
  public recaptureGlobalFocusEventAfterLocalFocusEvent = false;

  public loadCompleted = false;
  public renderingCompleted = false;

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
        webviewTag: true,
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
      cards.delete(this.id);
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

  public loadData = async () => {
    this.prop = await this.loadOrCreateCardData();
  };

  public renderCard = (_prop: CardProp) => {
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

  public loadHTML: () => Promise<void> = () => {
    return new Promise((resolve, reject) => {
      const finishLoadListener = (event: Electron.IpcMainEvent) => {
        // logger.debug('loadHTML  ' + fromId);

        // Don't use 'did-finish-load' event.
        // loadHTML resolves after loading HTML and processing required script are finished.
        //     this.window.webContents.on('did-finish-load', () => {
        ipcMain.off('finish-load-' + this.id, finishLoadListener);
        ipcMain.on('finish-load', this._finishReloadListener);
        this.loadCompleted = true;
      };
      ipcMain.on('finish-load-' + this.id, finishLoadListener);

      const readyLoadListener = (event: Electron.IpcMainEvent) => {
        ipcMain.off('ready-' + this.id, readyLoadListener);
        resolve();
      };
      ipcMain.on('ready-' + this.id, readyLoadListener);

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
      const geometry: Geometry | undefined =
        _prop.x === undefined ||
        _prop.y === undefined ||
        _prop.z === undefined ||
        _prop.width === undefined ||
        _prop.height === undefined
          ? undefined
          : {
            x: _prop.x,
            y: _prop.y,
            z: _prop.z,
            width: _prop.width,
            height: _prop.height,
          };
      const style: CardStyle | undefined =
        _prop.uiColor === undefined ||
        _prop.backgroundColor === undefined ||
        _prop.opacity === undefined ||
        _prop.zoom === undefined
          ? undefined
          : {
            uiColor: _prop.uiColor,
            backgroundColor: _prop.backgroundColor,
            opacity: _prop.opacity,
            zoom: _prop.zoom,
          };
      const date: CardDate | undefined =
        _prop.createdDate === undefined || _prop.modifiedDate === undefined
          ? undefined
          : {
            createdDate: _prop.createdDate,
            modifiedDate: _prop.modifiedDate,
          };
      return Promise.resolve(new CardProp(this.id, _prop.data, geometry, style, date));
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

  // @ts-ignore
  private _focusListener = e => {
    if (this.recaptureGlobalFocusEventAfterLocalFocusEvent) {
      this.recaptureGlobalFocusEventAfterLocalFocusEvent = false;
      setGlobalFocusEventListenerPermission(true);
    }
    if (this.suppressFocusEventOnce) {
      logger.debug(`skip focus event listener ${this.id}`);
      this.suppressFocusEventOnce = false;
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
