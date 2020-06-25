/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { IpcMessageEvent, ipcRenderer, remote, WebviewTag } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import contextMenu from 'electron-context-menu';
import {
  CardProp,
  CardPropSerializable,
  DEFAULT_CARD_GEOMETRY,
  DRAG_IMAGE_MARGIN,
} from './modules_common/cardprop';
import {
  CardCssStyle,
  contentsFrameCommand,
  ContentsFrameMessage,
  FileDropEvent,
  ICardEditor,
  InnerClickEvent,
} from './modules_common/types';
import { DialogButton } from './modules_common/const';
import { CardEditor } from './modules_ext/editor';
import {
  getRenderOffsetHeight,
  getRenderOffsetWidth,
  initCardRenderer,
  MESSAGE,
  render,
  UI_COLOR_DARKENING_RATE,
} from './modules_renderer/card_renderer';
import { darkenHexColor, logger } from './modules_common/utils';
import {
  deleteCard,
  saveCard,
  saveCardColor,
  waitUnfinishedTasks,
} from './modules_renderer/save';

let cardProp: CardProp = new CardProp('');

let cardCssStyle: CardCssStyle = {
  padding: { left: 0, right: 0, top: 0, bottom: 0 },
  border: { left: 0, right: 0, top: 0, bottom: 0 },
};

let isShiftDown = false;
let isCtrlDown = false;
let isAltDown = false;
let isMetaDown = false;

const cardEditor: ICardEditor = new CardEditor();

const close = async () => {
  await waitUnfinishedTasks(cardProp.id).catch((e: Error) => {
    logger.debug(e.message);
  });
  window.close();
};

/**
 * queueSaveCommand
 * Queuing and execute only last save command to avoid frequent save.
 */
let execSaveCommandTimeout: NodeJS.Timeout;
const execSaveCommand = () => {
  saveCard(cardProp);
};

const queueSaveCommand = () => {
  clearTimeout(execSaveCommandTimeout);
  execSaveCommandTimeout = setTimeout(execSaveCommand, 1000);
};

/**
 * Context Menu
 */

const changeCardColor = (backgroundColor: string, opacity = 1.0) => {
  const uiColor = darkenHexColor(backgroundColor, UI_COLOR_DARKENING_RATE);
  saveCardColor(cardProp, backgroundColor, uiColor, opacity);
  render(['CardStyle', 'EditorStyle']);
};

contextMenu({
  window: remote.getCurrentWindow(),
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
      label: MESSAGE.zoomIn,
      click: () => {
        if (cardProp.style.zoom < 1.0) {
          cardProp.style.zoom += 0.2;
        }
        else {
          cardProp.style.zoom += 0.5;
        }
        if (cardProp.style.zoom > 3) {
          cardProp.style.zoom = 3;
        }
        render(['CardStyle', 'EditorStyle']);

        saveCard(cardProp);
      },
    },
    {
      label: MESSAGE.zoomOut,
      click: () => {
        if (cardProp.style.zoom <= 1.0) {
          cardProp.style.zoom -= 0.2;
        }
        else {
          cardProp.style.zoom -= 0.5;
        }
        if (cardProp.style.zoom <= 0.4) {
          cardProp.style.zoom = 0.4;
        }
        render(['CardStyle', 'EditorStyle']);

        saveCard(cardProp);
      },
    },
    /*
    {
      label: MESSAGE.bringToFront,
      click: async () => {
        const newZ = await ipcRenderer.invoke('bring-to-front', cardProp.id);
        // eslint-disable-next-line require-atomic-updates
        cardProp.geometry.z = newZ;
        saveCard(cardProp);
      },
    },
    */
    {
      label: MESSAGE.sendToBack,
      click: async () => {
        const newZ = await ipcRenderer.invoke('send-to-back', cardProp.id);
        // eslint-disable-next-line require-atomic-updates
        cardProp.geometry.z = newZ;
        saveCard(cardProp);
      },
    },
  ],
  append: () => [
    {
      label: MESSAGE.yellow,
      click: () => {
        changeCardColor('#ffffa0');
      },
    },
    {
      label: MESSAGE.red,
      click: () => {
        changeCardColor('#ffb0b0');
      },
    },
    {
      label: MESSAGE.green,
      click: () => {
        changeCardColor('#d0ffd0');
      },
    },
    {
      label: MESSAGE.blue,
      click: () => {
        changeCardColor('#d0d0ff');
      },
    },
    {
      label: MESSAGE.orange,
      click: () => {
        changeCardColor('#ffb000');
      },
    },
    {
      label: MESSAGE.purple,
      click: () => {
        changeCardColor('#ffd0ff');
      },
    },
    {
      label: MESSAGE.white,
      click: () => {
        changeCardColor('#ffffff');
      },
    },
    {
      label: MESSAGE.gray,
      click: () => {
        changeCardColor('#d0d0d0');
      },
    },
    {
      label: MESSAGE.transparent,
      click: () => {
        changeCardColor('#ffffff', 0.0);
      },
    },
  ],
});

/**
 * Initialize
 */
const initializeUIEvents = () => {
  document.addEventListener('keydown', e => {
    isShiftDown = e.shiftKey;
    isCtrlDown = e.ctrlKey;
    isAltDown = e.altKey;
    isMetaDown = e.metaKey; // Windows key, Command key
  });

  document.addEventListener('keyup', e => {
    isShiftDown = e.shiftKey;
    isCtrlDown = e.ctrlKey;
    isAltDown = e.altKey;
    isMetaDown = e.metaKey; // Windows key, Command key
  });

  document.addEventListener('dragover', e => {
    e.preventDefault();
    return false;
  });

  // eslint-disable-next-line no-unused-expressions
  document.getElementById('newBtn')?.addEventListener('click', async () => {
    // Position of a new card is relative to this card.
    const geometry = DEFAULT_CARD_GEOMETRY;
    geometry.x = cardProp.geometry.x + 30;
    geometry.y = cardProp.geometry.y + 30;

    const newId = await ipcRenderer.invoke('create-card', {
      x: geometry.x,
      y: geometry.y,
      z: geometry.z + 1,
      width: geometry.width,
      height: geometry.height,
    });
    ipcRenderer.invoke('focus', newId);
  });

  // eslint-disable-next-line no-unused-expressions
  document.getElementById('codeBtn')?.addEventListener('click', () => {
    cardEditor.toggleCodeMode();
  });

  // eslint-disable-next-line no-unused-expressions
  document.getElementById('closeBtn')?.addEventListener('click', () => {
    if (cardEditor.isOpened) {
      if (cardEditor.editorType === 'Markup') {
        cardEditor.hideEditor();
      }
      const [dataChanged, data] = cardEditor.endEdit();
      cardProp.data = data;
      render(['TitleBar', 'ContentsData', 'ContentsRect']);
      if (dataChanged && cardProp.data !== '') {
        saveCard(cardProp);
      }
    }
    if (cardProp.data === '' || isCtrlDown) {
      deleteCard(cardProp);
    }
    else {
      /**
       * Don't use window.confirm(MESSAGE.confirm_closing)
       * It disturbs correct behavior of CKEditor.
       * Caret of CKEditor is disappeared just after push Cancel button of window.confirm()
       */
      ipcRenderer
        .invoke(
          'confirm-dialog',
          cardProp.id,
          [MESSAGE.btnCloseCard, 'Cancel'],
          MESSAGE.confirmClosing
        )
        .then((res: number) => {
          if (res === DialogButton.Default) {
            // OK
            close();
          }
          else if (res === DialogButton.Cancel) {
            // Cancel
          }
        })
        .catch((e: Error) => {
          logger.debug(e.message);
        });
    }
  });
};

const onload = async () => {
  window.removeEventListener('load', onload, false);

  const url = window.location.search;
  const arr = url.slice(1).split('&');
  const params: { [key: string]: string } = {};
  for (var i = 0; i < arr.length; i++) {
    const pair = arr[i].split('=');
    params[pair[0]] = pair[1];
  }
  const id = params.id;
  if (!id) {
    console.error('id parameter is not given in URL');
    return;
  }

  cardCssStyle = {
    padding: {
      left: parseInt(
        window.getComputedStyle(document.getElementById('contents')!).paddingLeft,
        10
      ),
      right: parseInt(
        window.getComputedStyle(document.getElementById('contents')!).paddingRight,
        10
      ),
      top: parseInt(
        window.getComputedStyle(document.getElementById('contents')!).paddingTop,
        10
      ),
      bottom: parseInt(
        window.getComputedStyle(document.getElementById('contents')!).paddingBottom,
        10
      ),
    },
    border: {
      left: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderLeft,
        10
      ),
      right: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderRight,
        10
      ),
      top: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderTop,
        10
      ),
      bottom: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderBottom,
        10
      ),
    },
  };

  initializeContentsFrameEvents();
  initializeUIEvents();

  const webview = document.getElementById('contentsFrame')! as WebviewTag;
  const isWebviewLoaded = new Promise((resolve, reject) => {
    let counter = 0;
    const checkTimer = setInterval(() => {
      if (webview.isLoading()) {
        clearInterval(checkTimer);
        resolve();
      }
      else {
        counter++;
        if (counter > 100) {
          reject(new Error('Failed to load webview'));
        }
      }
    }, 100);
  });

  await Promise.all([cardEditor.loadUI(cardCssStyle), isWebviewLoaded]).catch(e => {
    logger.error(e.message);
  });

  // console.debug('(2) loadUI is completed');
  ipcRenderer.send('finish-load', id);
};

const initializeIPCEvents = () => {
  // ipc (inter-process communication)

  // Render card data
  ipcRenderer.on(
    'render-card',
    (event: Electron.IpcRendererEvent, _prop: CardPropSerializable) => {
      cardProp = CardProp.fromObject(_prop);

      initCardRenderer(cardProp, cardCssStyle, cardEditor);

      cardEditor.setCard(cardProp);

      document.getElementById('card')!.style.visibility = 'visible';

      render();

      if (cardEditor.editorType === 'WYSIWYG') {
        cardEditor
          .showEditor()
          .then(() => {
            ipcRenderer.invoke('finish-render-card', cardProp.id);
          })
          .catch((e: Error) => {
            // logger.error does not work in ipcRenderer event.
            console.error(`Error in render-card: ${e.message}`);
          });
      }
      else {
        ipcRenderer.invoke('finish-render-card', cardProp.id).catch((e: Error) => {
          // logger.error does not work in ipcRenderer event.
          console.error(`Error in render-card: ${e.message}`);
        });
      }
    }
  );

  ipcRenderer.on('card-close', () => {
    close();
  });

  ipcRenderer.on('card-focused', async () => {
    console.debug('card-focused');

    cardProp.status = 'Focused';
    render(['CardStyle']);

    if (cardEditor.editorType === 'WYSIWYG') {
      cardEditor.startEdit();
    }
    const newZ = await ipcRenderer.invoke('bring-to-front', cardProp.id);
    // eslint-disable-next-line require-atomic-updates
    cardProp.geometry.z = newZ;
    saveCard(cardProp);
  });

  ipcRenderer.on('card-blurred', () => {
    console.debug('card-blurred');

    cardProp.status = 'Blurred';
    render(['CardStyle']);

    if (cardEditor.isOpened) {
      if (cardEditor.editorType === 'Markup') {
        cardEditor.hideEditor();
      }
      const [dataChanged, data] = cardEditor.endEdit();
      if (dataChanged) {
        cardProp.data = data;
        render();
        saveCard(cardProp);
      }
    }
  });

  ipcRenderer.on(
    'resize-by-hand',
    (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
      cardProp.geometry.width = Math.round(newBounds.width + getRenderOffsetWidth());
      cardProp.geometry.height = Math.round(newBounds.height + getRenderOffsetHeight());

      render(['TitleBar', 'ContentsRect', 'EditorRect']);

      queueSaveCommand();
    }
  );

  ipcRenderer.on(
    'move-by-hand',
    (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
      cardProp.geometry.x = Math.round(newBounds.x);
      cardProp.geometry.y = Math.round(newBounds.y);

      queueSaveCommand();
    }
  );
};

const sendMouseInput = async (clickEvent: InnerClickEvent) => {
  await cardEditor.showEditor().catch((e: Error) => {
    logger.error(`Error in clicking contents: ${e.message}`);
  });
  await cardEditor.startEdit();
  const offsetY = document.getElementById('titleBar')!.offsetHeight;
  ipcRenderer.invoke('send-mouse-input', cardProp.id, clickEvent.x, clickEvent.y + offsetY);
};
const addDroppedImage = (fileDropEvent: FileDropEvent) => {
  /*
   * Must sanitize params from webview
   * - fileDropEvent.path is checked whether it is correct path or not
   *   by using dropImg.src = fileDropEvent.path;
   *   Incorrect path cannot be loaded.
   * - Break 'onXXX=' event format in fileDropEvent.name by replacing '=' with '-'.
   */
  fileDropEvent.name = fileDropEvent.name.replace('=', '-');

  const dropImg = new Image();

  dropImg.addEventListener('load', async () => {
    let imageOnly = false;
    if (cardProp.data === '') {
      imageOnly = true;
    }
    const width = dropImg.naturalWidth;
    const height = dropImg.naturalHeight;

    let newImageWidth =
      cardProp.geometry.width -
      (imageOnly ? DRAG_IMAGE_MARGIN : 0) -
      cardCssStyle.border.left -
      cardCssStyle.border.right -
      cardCssStyle.padding.left -
      cardCssStyle.padding.right;

    let newImageHeight = height;
    if (newImageWidth < width) {
      newImageHeight = (height * newImageWidth) / width;
    }
    else {
      newImageWidth = width;
    }

    newImageWidth = Math.floor(newImageWidth);
    newImageHeight = Math.floor(newImageHeight);

    const imgTag = cardEditor.getImageTag(
      uuidv4(),
      fileDropEvent.path,
      newImageWidth,
      newImageHeight,
      fileDropEvent.name
    );

    if (imageOnly) {
      cardProp.geometry.height =
        newImageHeight +
        DRAG_IMAGE_MARGIN +
        cardCssStyle.border.top +
        cardCssStyle.border.bottom +
        cardCssStyle.padding.top +
        cardCssStyle.padding.bottom +
        document.getElementById('titleBar')!.offsetHeight;

      cardProp.data = imgTag;
    }
    else {
      cardProp.geometry.height = cardProp.geometry.height + newImageHeight;

      cardProp.data = cardProp.data + '<br />' + imgTag;
    }

    await ipcRenderer.invoke(
      'set-window-size',
      cardProp.id,
      cardProp.geometry.width,
      cardProp.geometry.height
    );

    if (imageOnly) {
      saveCardColor(cardProp, '#ffffff', '#ffffff', 0.0);
    }
    else {
      saveCard(cardProp);
    }
    render(['TitleBar', 'CardStyle', 'ContentsData', 'ContentsRect']);

    ipcRenderer.invoke('focus', cardProp.id);
    await cardEditor.showEditor().catch((err: Error) => {
      logger.error(`Error in loading image: ${err.message}`);
    });
    cardEditor.startEdit();
  });

  dropImg.src = fileDropEvent.path;
};

const initializeContentsFrameEvents = () => {
  const getMessage = (event: IpcMessageEvent): ContentsFrameMessage => {
    if (event.channel !== 'message' || !event.args || !event.args[0]) {
      return { command: '', arg: '' };
    }
    const msg: ContentsFrameMessage = event.args[0];
    if (!contentsFrameCommand.includes(msg.command)) {
      return { command: '', arg: '' };
    }
    return msg;
  };

  const webview = document.getElementById('contentsFrame')! as WebviewTag;
  webview.addEventListener('ipc-message', event => {
    const msg: ContentsFrameMessage = getMessage(event);
    switch (msg.command) {
      case 'contents-frame-loaded':
        render(['CardStyle']);
        break;

      case 'click-parent':
        // Click request from child frame (webview)
        if (msg.arg !== undefined) {
          sendMouseInput(JSON.parse(msg.arg) as InnerClickEvent);
        }
        break;

      case 'contents-frame-file-dropped':
        if (msg.arg !== undefined) {
          addDroppedImage(JSON.parse(msg.arg) as FileDropEvent);
        }
        break;

      default:
        break;
    }
  });
};

initializeIPCEvents();
window.addEventListener('load', onload, false);
