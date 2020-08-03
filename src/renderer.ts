/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

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
import { CardEditor } from './modules_renderer/editor';
import {
  getRenderOffsetHeight,
  getRenderOffsetWidth,
  initCardRenderer,
  render,
} from './modules_renderer/card_renderer';
import { darkenHexColor } from './modules_common/color';
import {
  deleteCard,
  saveCard,
  saveCardColor,
  waitUnfinishedTasks,
} from './modules_renderer/save';
import window from './modules_renderer/window';

const UI_COLOR_DARKENING_RATE = 0.8;

let cardProp: CardProp = new CardProp('');

let cardCssStyle: CardCssStyle = {
  padding: { left: 0, right: 0, top: 0, bottom: 0 },
  border: { left: 0, right: 0, top: 0, bottom: 0 },
};

let canClose = false;

let isShiftDown = false;
let isCtrlDown = false;
let isAltDown = false;
let isMetaDown = false;

const cardEditor: ICardEditor = new CardEditor();

const close = async () => {
  await waitUnfinishedTasks(cardProp.id).catch((e: Error) => {
    console.error(e.message);
  });
  canClose = true;
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

    const newId = await window.api.createCard({
      x: geometry.x,
      y: geometry.y,
      z: geometry.z + 1,
      width: geometry.width,
      height: geometry.height,
    });
    window.api.focus(newId);
  });

  // eslint-disable-next-line no-unused-expressions
  document.getElementById('codeBtn')?.addEventListener('click', () => {
    cardEditor.toggleCodeMode();
  });

  // eslint-disable-next-line no-unused-expressions
  document.getElementById('closeBtn')?.addEventListener('click', event => {
    if (cardEditor.isOpened) {
      if (cardEditor.editorType === 'Markup') {
        cardEditor.hideEditor();
      }
      const { dataChanged, data } = cardEditor.endEdit();
      cardProp.data = data;
      render(['TitleBar', 'ContentsData', 'ContentsRect']);
      if (dataChanged && cardProp.data !== '') {
        saveCard(cardProp);
      }
    }
    if (cardProp.data === '' || event.ctrlKey) {
      deleteCard(cardProp);
    }
    else {
      /**
       * Don't use window.confirm(MESSAGE.confirm_closing)
       * It disturbs correct behavior of CKEditor.
       * Caret of CKEditor is disappeared just after push Cancel button of window.confirm()
       */
      window.api
        .confirmDialog(cardProp.id, ['btnCloseCard', 'btnCancel'], 'confirmClosing')
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
          console.error(e.message);
        });
    }
  });
};

const waitIframeInitializing = () => {
  return new Promise((resolve, reject) => {
    const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;

    const initializingReceived = (event: MessageEvent) => {
      const msg: ContentsFrameMessage = filterContentsFrameMessage(event);
      if (msg.command === 'contents-frame-initialized') {
        clearInterval(iframeLoadTimer);
        window.removeEventListener('message', initializingReceived);
        resolve();
      }
    };
    window.addEventListener('message', initializingReceived);
    let counter = 0;
    const iframeLoadTimer = setInterval(() => {
      const msg: ContentsFrameMessage = { command: 'check-initializing', arg: '' };
      iframe.contentWindow!.postMessage(msg, '*');
      if (++counter > 100) {
        clearInterval(iframeLoadTimer);
        reject(new Error('Cannot load iframe in waitIframeInitializing()'));
      }
    }, 100);
  });
};

const initializeContentsFrameEvents = () => {
  const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;

  window.addEventListener('message', (event: MessageEvent) => {
    const msg: ContentsFrameMessage = filterContentsFrameMessage(event);
    switch (msg.command) {
      case 'click-parent':
        // Click request from child frame
        if (msg.arg !== undefined) {
          startEditorByClick(JSON.parse(msg.arg) as InnerClickEvent);
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

  initializeUIEvents();

  await Promise.all([cardEditor.loadUI(cardCssStyle), waitIframeInitializing()]).catch(
    e => {
      console.error(e.message);
    }
  );

  initializeContentsFrameEvents();

  window.api.finishLoad(id);
};

// eslint-disable-next-line complexity
window.addEventListener('message', event => {
  if (event.source !== window || !event.data.command) return;
  switch (event.data.command) {
    case 'card-blurred':
      onCardBlurred();
      break;
    case 'card-close':
      onCardClose();
      break;
    case 'card-focused':
      onCardFocused();
      break;
    case 'change-card-color':
      onChangeCardColor(event.data.backgroundColor, event.data.opacity);
      break;
    case 'move-by-hand':
      onMoveByHand(event.data.bounds);
      break;
    case 'render-card':
      onRenderCard(event.data.prop);
      break;
    case 'resize-by-hand':
      onResizeByHand(event.data.bounds);
      break;
    case 'send-to-back':
      onSendToBack();
      break;
    case 'zoom-in':
      onZoomIn();
      break;
    case 'zoom-out':
      onZoomOut();
      break;
    default:
      break;
  }
});

const onCardClose = () => {
  close();
};

const onCardFocused = async () => {
  cardProp.status = 'Focused';
  render(['CardStyle']);

  if (cardEditor.editorType === 'WYSIWYG') {
    cardEditor.startEdit();
  }
  const newZ = await window.api.bringToFront(cardProp.id);
  // eslint-disable-next-line require-atomic-updates
  cardProp.geometry.z = newZ;
  saveCard(cardProp);
};

const onCardBlurred = () => {
  cardProp.status = 'Blurred';
  render(['CardStyle']);

  if (cardEditor.isOpened) {
    if (cardEditor.editorType === 'Markup') {
      if (cardEditor.isCodeMode) {
        return;
      }

      cardEditor.hideEditor();
    }
    const { dataChanged, data } = cardEditor.endEdit();
    if (dataChanged) {
      cardProp.data = data;
      render();
      saveCard(cardProp);
    }

    const { left, top } = cardEditor.getScrollPosition();
    const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
    iframe.contentWindow!.scrollTo(left, top);
  }
};

const onChangeCardColor = (backgroundColor: string, opacity = 1.0) => {
  const uiColor = darkenHexColor(backgroundColor, UI_COLOR_DARKENING_RATE);
  saveCardColor(cardProp, backgroundColor, uiColor, opacity);
  render(['CardStyle', 'EditorStyle']);
};

const onResizeByHand = (newBounds: Electron.Rectangle) => {
  cardProp.geometry.width = Math.round(newBounds.width + getRenderOffsetWidth());
  cardProp.geometry.height = Math.round(newBounds.height + getRenderOffsetHeight());

  render(['TitleBar', 'ContentsRect', 'EditorRect']);

  queueSaveCommand();
};

const onMoveByHand = (newBounds: Electron.Rectangle) => {
  cardProp.geometry.x = Math.round(newBounds.x);
  cardProp.geometry.y = Math.round(newBounds.y);

  queueSaveCommand();
};

// Render card data
const onRenderCard = (_prop: CardPropSerializable) => {
  cardProp = CardProp.fromObject(_prop);

  initCardRenderer(cardProp, cardCssStyle, cardEditor);

  cardEditor.setCard(cardProp);

  document.getElementById('card')!.style.visibility = 'visible';

  render()
    .then(() => {
      const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
      // Listen load event for reload()
      iframe.addEventListener('load', e => {
        render(['ContentsData', 'CardStyle']);
      });
    })
    .catch(e => {
      console.error(`Error in render-card: ${e.message}`);
    });

  if (cardEditor.editorType === 'WYSIWYG') {
    cardEditor
      .showEditor()
      .then(() => {
        window.api.finishRenderCard(cardProp.id);
      })
      .catch((e: Error) => {
        // logger.error does not work in ipcRenderer event.
        console.error(`Error in render-card: ${e.message}`);
      });
  }
  else {
    window.api.finishRenderCard(cardProp.id).catch((e: Error) => {
      // logger.error does not work in ipcRenderer event.
      console.error(`Error in render-card: ${e.message}`);
    });
  }
};

const onSendToBack = async () => {
  const newZ = await window.api.sendToBack(cardProp.id);
  // eslint-disable-next-line require-atomic-updates
  cardProp.geometry.z = newZ;
  saveCard(cardProp);
};

const onZoomIn = () => {
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
};

const onZoomOut = () => {
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
};

const filterContentsFrameMessage = (event: MessageEvent): ContentsFrameMessage => {
  const msg: ContentsFrameMessage = event.data;
  if (!contentsFrameCommand.includes(msg.command)) {
    return { command: '', arg: '' };
  }
  return msg;
};

const startEditorByClick = async (clickEvent: InnerClickEvent) => {
  await cardEditor.showEditor().catch((e: Error) => {
    console.error(`Error in clicking contents: ${e.message}`);
  });

  // Set scroll position of editor to that of iframe
  const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
  const scrollTop = iframe.contentWindow!.scrollY;
  const scrollLeft = iframe.contentWindow!.scrollX;
  cardEditor.setScrollPosition(scrollLeft, scrollTop);

  const offsetY = document.getElementById('titleBar')!.offsetHeight;
  cardEditor.execAfterMouseDown(cardEditor.startEdit);
  window.api.sendLeftMouseDown(cardProp.id, clickEvent.x, clickEvent.y + offsetY);
};

const addDroppedImage = async (fileDropEvent: FileDropEvent) => {
  const uuid: string = await window.api.getUuid();
  /*
   * Must sanitize params from iframe
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
      uuid,
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

    await window.api.setWindowSize(
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

    window.api.focus(cardProp.id);
    await cardEditor.showEditor().catch((err: Error) => {
      console.error(`Error in loading image: ${err.message}`);
    });
    cardEditor.startEdit();
  });

  dropImg.src = fileDropEvent.path;
};

window.addEventListener('load', onload, false);
window.addEventListener('beforeunload', async e => {
  if (!canClose) {
    await waitUnfinishedTasks(cardProp.id).catch((error: Error) => {
      console.error(error.message);
    });
    //    e.preventDefault();
    //    e.returnValue = '';
    console.debug('Closing by operating system');
  }
});

// Remove APIs
const disableAPIList = ['open', 'alert', 'confirm', 'prompt', 'print'];
disableAPIList.forEach(prop => {
  // @ts-ignore
  window[prop] = () => {
    console.error(prop + ' is disabled.');
  };
});
