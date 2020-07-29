/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BrowserWindow, dialog, ipcMain, shell, WebContents } from 'electron';
import contextMenu from 'electron-context-menu';
import { CardProp } from '../modules_common/cardprop';
import { CardIO } from './io';
import { getCurrentDateAndTime } from '../modules_common/utils';
import { logger } from './logger';
import { CardInitializeType } from '../modules_common/types';
import { MESSAGE } from '../modules_common/i18n';
import { cardColors, ColorName } from '../modules_common/color';

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

export const deleteCard = async (id: string) => {
  await CardIO.deleteCardData(id)
    .catch((e: Error) => {
      logger.error(`delete-card: ${e.message}`);
    })
    .then(() => {
      logger.debug(`deleted : ${id}`);
      // eslint-disable-next-line no-unused-expressions
      const card = cards.get(id);
      if (card) {
        card.window.destroy();
      }
    })
    .catch((e: Error) => {
      logger.error(`card destroy: ${e.message}`);
    });
};

/**
 * Context Menu
 */

const setContextMenu = (win: BrowserWindow) => {
  const setColor = (name: ColorName) => {
    return {
      label: MESSAGE(name),
      click: () => {
        if (name === 'transparent') {
          win.webContents.send('change-card-color', cardColors[name], 0.0);
        }
        else {
          win.webContents.send('change-card-color', cardColors[name]);
        }
      },
    };
  };

  contextMenu({
    window: win,
    showSaveImageAs: true,
    showInspectElement: false,
    menu: actions => [
      actions.searchWithGoogle({}),
      actions.separator(),
      actions.cut({}),
      actions.copy({}),
      actions.paste({}),
      actions.separator(),
      actions.saveImageAs({}),
      actions.separator(),
      actions.copyLink({}),
      actions.separator(),
    ],
    prepend: () => [
      {
        label: MESSAGE('zoomIn'),
        click: () => {
          win.webContents.send('zoom-in');
        },
      },
      {
        label: MESSAGE('zoomOut'),
        click: () => {
          win.webContents.send('zoom-out');
        },
      },
      {
        label: MESSAGE('sendToBack'),
        click: () => {
          win.webContents.send('send-to-back');
        },
      },
    ],
    append: () => [
      setColor('yellow'),
      setColor('red'),
      setColor('green'),
      setColor('blue'),
      setColor('orange'),
      setColor('purple'),
      setColor('white'),
      setColor('gray'),
      setColor('transparent'),
    ],
  });
};

export class Card {
  public prop: CardProp; // ! is Definite assignment assertion
  public window: BrowserWindow;
  public indexUrl: string;

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

    this.indexUrl = url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true,
      query: {
        id: this.prop.id,
      },
    });

    this.window = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, '../modules_renderer/preload.js'),
        sandbox: true,
        contextIsolation: true,
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

    // this.window.webContents.openDevTools();

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

    setContextMenu(this.window);

    this.window.webContents.on('did-finish-load', () => {
      const checkNavigation = (_event: Electron.Event, navUrl: string) => {
        console.debug('did-start-navigate : ' + navUrl);
        // Check top frame
        const topFrameURL = this.indexUrl.replace(/\\/g, '/');
        if (navUrl === topFrameURL) {
          // Top frame is reloaded
          this.window.webContents.off('did-start-navigation', checkNavigation);
          logger.debug('Top frame is reloaded.');
          return true;
        }

        // Check iframe
        const iframeRex = new RegExp(
          topFrameURL.replace(/index.html\?.+$/, 'iframe/contents_frame.html$')
        );
        const isValid = iframeRex.test(navUrl);
        if (navUrl === 'about:blank') {
          // skip
        }
        else if (isValid) {
          // console.debug(`Block navigation to valid url: ${url}`);
          // When iframe is reloaded, cardWindow must be also reloaded not to apply tampered sandbox attributes to iframe.
          logger.error(`Block navigation to valid url: ${navUrl}`);
          this.window.webContents.off('did-start-navigation', checkNavigation);

          // Same origin policy between top frame and iframe is failed after reload(). (Cause unknown)
          // Create and destroy card for workaround.
          // this.window.webContents.send('reload');
          const card = new Card('Load', this.prop.id);
          const prevWin = this.window;
          const tmpCard = cards.get(this.prop.id);
          card
            .render()
            .then(() => {
              prevWin.destroy();
              cards.set(this.prop.id, card);
            })
            .catch(() => {});
        }
        else {
          logger.error(`Block navigation to invalid url: ${navUrl}`);
          this.window.webContents.off('did-start-navigation', checkNavigation);
          /**
           * 1. Call window.api.finishRenderCard(cardProp.id) to tell initialize process the error
           * 2. Show alert dialog
           * 3. Remove malicious card
           */
          this.renderingCompleted = true;
          dialog.showMessageBoxSync(this.window, {
            type: 'question',
            buttons: ['OK'],
            message: 'Page navigation is not permitted. The card is removed.',
          });
          // Reload if permitted
          // Destroy if not permitted
          /*
          await deleteCard(this.prop.id);
          cards.delete(this.prop.id);
          this.window.destroy();
        */
        }
      };
      console.debug('did-finish-load: ' + this.window.webContents.getURL());
      this.window.webContents.on('did-start-navigation', checkNavigation);
    });

    this.window.webContents.on('will-navigate', (event, navUrl) => {
      // block page transition
      const prevUrl = this.indexUrl.replace(/\\/g, '/');
      if (navUrl === prevUrl) {
        // console.debug('reload() in top frame is permitted');
      }
      else {
        logger.error('Page navigation in top frame is not permitted.');
        event.preventDefault();
      }
    });
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

  private _finishReloadListener = (event: Electron.IpcMainInvokeEvent) => {
    console.log(`reloaded in main: ${this.prop.id}`);
    this.window.webContents.send('render-card', this.prop.toObject()); // CardProp must be serialize because passing non-JavaScript objects to IPC methods is deprecated and will throw an exception beginning with Electron 9.
  };

  private _loadHTML: () => Promise<void> = () => {
    return new Promise((resolve, reject) => {
      const finishLoadListener = (event: Electron.IpcMainInvokeEvent) => {
        logger.debug('loadHTML  ' + this.prop.id);

        // Don't use 'did-finish-load' event.
        // loadHTML resolves after loading HTML and processing required script are finished.
        //     this.window.webContents.on('did-finish-load', () => {
        // ipcMain.handle('finish-load-' + this.prop.id, this._finishReloadListener);
        resolve();
      };
      ipcMain.handleOnce('finish-load-' + this.prop.id, finishLoadListener);

      this.window.webContents.on(
        'did-fail-load',
        (event, errorCode, errorDescription, validatedURL) => {
          reject(new Error(`Error in loadHTML: ${validatedURL} ${errorDescription}`));
        }
      );

      this.window.loadURL(this.indexUrl);
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
