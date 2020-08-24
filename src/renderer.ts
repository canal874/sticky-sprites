/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Cipher } from 'crypto';
import {
  AvatarProp,
  AvatarPropSerializable,
  CardProp,
  CardPropSerializable,
  CardStatus,
  CardStyle,
  cardVersion,
  DEFAULT_CARD_GEOMETRY,
  DRAG_IMAGE_MARGIN,
  Geometry,
  getAvatarLocation,
} from './modules_common/cardprop';
import {
  CardCssStyle,
  contentsFrameCommand,
  ContentsFrameMessage,
  FileDropEvent,
  ICardEditor,
  InnerClickEvent,
} from './modules_common/types';
import { DialogButton, scheme } from './modules_common/const';
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

let avatarProp: AvatarProp = new AvatarProp('');

let avatarUrl: string;

let cardCssStyle: CardCssStyle = {
  borderWidth: 0,
};

let canClose = false;

let isShiftDown = false;
let isCtrlDown = false;
let isAltDown = false;
let isMetaDown = false;

const cardEditor: ICardEditor = new CardEditor();

const close = async () => {
  await waitUnfinishedTasks(avatarProp.url).catch((e: Error) => {
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
  saveCard(avatarProp);
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
    geometry.x = avatarProp.geometry.x + 30;
    geometry.y = avatarProp.geometry.y + 30;
    const avatars: { [key: string]: Geometry & CardStyle } = {};
    avatars[getAvatarLocation(avatarProp.url)] = {
      x: geometry.x,
      y: geometry.y,
      z: geometry.z + 1,
      width: geometry.width,
      height: geometry.height,
      uiColor: avatarProp.style.uiColor,
      backgroundColor: avatarProp.style.backgroundColor,
      opacity: avatarProp.style.opacity,
      zoom: avatarProp.style.zoom,
    };
    const newId = await window.api.createCard({
      avatars: avatars,
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
      cardEditor.hideEditor();
      const { dataChanged, data } = cardEditor.endEdit();
      avatarProp.data = data;
      render(['TitleBar', 'ContentsData', 'ContentsRect']);
      if (dataChanged && avatarProp.data !== '') {
        saveCard(avatarProp);
      }
    }
    if (avatarProp.data === '' || event.ctrlKey) {
      deleteCard(avatarProp);
    }
    else {
      /**
       * Don't use window.confirm(MESSAGE.confirm_closing)
       * It disturbs correct behavior of CKEditor.
       * Caret of CKEditor is disappeared just after push Cancel button of window.confirm()
       */
      window.api
        .confirmDialog(avatarProp.url, ['btnCloseCard', 'btnCancel'], 'confirmClosing')
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

  let prevMouseX: number;
  let prevMouseY: number;
  let isHorizontalMoving = false;
  let isVerticalMoving = false;
  const onMouseMove = async (event: MouseEvent) => {
    let newWidth = avatarProp.geometry.width + getRenderOffsetWidth();
    let newHeight = avatarProp.geometry.height + getRenderOffsetHeight();
    if (isHorizontalMoving) {
      newWidth += event.screenX - prevMouseX;
    }
    if (isVerticalMoving) {
      newHeight += event.screenY - prevMouseY;
    }
    prevMouseX = event.screenX;
    prevMouseY = event.screenY;

    if (isHorizontalMoving || isVerticalMoving) {
      const rect: {
        x: number;
        y: number;
        width: number;
        height: number;
      } = await window.api.setWindowSize(avatarProp.url, newWidth, newHeight);
      onResizeByHand(rect);
    }
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', event => {
    isHorizontalMoving = false;
    isVerticalMoving = false;
    document.getElementById('windowMask')!.style.display = 'none';
  });
  window.addEventListener('mouseleave', event => {});

  document.getElementById('resizeAreaRight')!.addEventListener('mousedown', event => {
    isHorizontalMoving = true;
    document.getElementById('windowMask')!.style.display = 'block';
    prevMouseX = event.screenX;
    prevMouseY = event.screenY;
  });

  document.getElementById('resizeAreaBottom')!.addEventListener('mousedown', event => {
    isVerticalMoving = true;
    document.getElementById('windowMask')!.style.display = 'block';
    prevMouseX = event.screenX;
    prevMouseY = event.screenY;
  });

  document.getElementById('resizeAreaRightBottom')!.addEventListener('mousedown', event => {
    isVerticalMoving = true;
    isHorizontalMoving = true;
    document.getElementById('windowMask')!.style.display = 'block';
    prevMouseX = event.screenX;
    prevMouseY = event.screenY;
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
  avatarUrl = params.avatarUrl;
  if (!avatarUrl) {
    console.error('id parameter is not given in URL');
    return;
  }

  cardCssStyle = {
    borderWidth: parseInt(
      window.getComputedStyle(document.getElementById('card')!).borderLeft,
      10
    ),
  };

  initializeUIEvents();

  await Promise.all([cardEditor.loadUI(cardCssStyle), waitIframeInitializing()]).catch(
    e => {
      console.error(e.message);
    }
  );

  initializeContentsFrameEvents();

  window.api.finishLoad(avatarUrl);
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
    case 'set-lock':
      onSetLock(event.data.locked);
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
  avatarProp.status = 'Focused';
  render(['CardStyle', 'ContentsRect']);

  const newZ = await window.api.bringToFront(avatarProp.url);
  // eslint-disable-next-line require-atomic-updates
  avatarProp.geometry.z = newZ;
  saveCard(avatarProp);
};

const onCardBlurred = () => {
  avatarProp.status = 'Blurred';
  render(['CardStyle', 'ContentsRect']);

  if (cardEditor.isOpened) {
    if (cardEditor.isCodeMode) {
      return;
    }
    endEditor();
  }
};

const onChangeCardColor = (backgroundColor: string, opacity = 1.0) => {
  const uiColor = darkenHexColor(backgroundColor);
  saveCardColor(avatarProp, backgroundColor, uiColor, opacity);
  render(['CardStyle', 'TitleBarStyle', 'EditorStyle']);
};

const onResizeByHand = (newBounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  avatarProp.geometry.width = Math.round(newBounds.width - getRenderOffsetWidth());
  avatarProp.geometry.height = Math.round(newBounds.height - getRenderOffsetHeight());

  render(['TitleBar', 'ContentsRect', 'EditorRect']);

  queueSaveCommand();
};

const onMoveByHand = (newBounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  avatarProp.geometry.x = Math.round(newBounds.x);
  avatarProp.geometry.y = Math.round(newBounds.y);

  queueSaveCommand();
};

// Render card data
const onRenderCard = (_prop: AvatarPropSerializable) => {
  avatarProp = AvatarProp.fromObject(_prop);

  initCardRenderer(avatarProp, cardCssStyle, cardEditor);

  cardEditor.setCard(avatarProp);

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

  window.api.finishRenderCard(avatarProp.url).catch((e: Error) => {
    // logger.error does not work in ipcRenderer event.
    console.error(`Error in render-card: ${e.message}`);
  });
};

const onSendToBack = async () => {
  const newZ = await window.api.sendToBack(avatarProp.url);
  // eslint-disable-next-line require-atomic-updates
  avatarProp.geometry.z = newZ;
  saveCard(avatarProp);
};

const onSetLock = (locked: boolean) => {
  avatarProp.condition.locked = locked;
  if (cardEditor.isOpened) {
    endEditor();
  }
};

const onZoomIn = () => {
  if (avatarProp.style.zoom < 1.0) {
    avatarProp.style.zoom += 0.2;
  }
  else {
    avatarProp.style.zoom += 0.5;
  }
  if (avatarProp.style.zoom > 3) {
    avatarProp.style.zoom = 3;
  }
  render(['CardStyle', 'EditorStyle']);

  saveCard(avatarProp);
};

const onZoomOut = () => {
  if (avatarProp.style.zoom <= 1.0) {
    avatarProp.style.zoom -= 0.2;
  }
  else {
    avatarProp.style.zoom -= 0.5;
  }
  if (avatarProp.style.zoom <= 0.4) {
    avatarProp.style.zoom = 0.4;
  }
  render(['CardStyle', 'EditorStyle']);

  saveCard(avatarProp);
};

const filterContentsFrameMessage = (event: MessageEvent): ContentsFrameMessage => {
  const msg: ContentsFrameMessage = event.data;
  if (!contentsFrameCommand.includes(msg.command)) {
    return { command: '', arg: '' };
  }
  return msg;
};

const startEditor = async (x: number, y: number) => {
  await cardEditor.showEditor().catch((e: Error) => {
    console.error(`Error in startEditor: ${e.message}`);
  });

  // Set scroll position of editor to that of iframe
  const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
  const scrollTop = iframe.contentWindow!.scrollY;
  const scrollLeft = iframe.contentWindow!.scrollX;
  cardEditor.setScrollPosition(scrollLeft, scrollTop);

  const offsetY = document.getElementById('title')!.offsetHeight;
  cardEditor.execAfterMouseDown(cardEditor.startEdit);
  window.api.sendLeftMouseDown(avatarProp.url, x, y + offsetY);
};

const endEditor = () => {
  cardEditor.hideEditor();

  const { dataChanged, data } = cardEditor.endEdit();
  if (dataChanged) {
    avatarProp.data = data;
    render();
    saveCard(avatarProp);
  }

  const { left, top } = cardEditor.getScrollPosition();
  const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
  iframe.contentWindow!.scrollTo(left, top);
};

const startEditorByClick = (clickEvent: InnerClickEvent) => {
  if (avatarProp.condition.locked) {
    return;
  }
  startEditor(clickEvent.x, clickEvent.y);
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
    if (avatarProp.data === '') {
      imageOnly = true;
    }
    const width = dropImg.naturalWidth;
    const height = dropImg.naturalHeight;

    let newImageWidth =
      avatarProp.geometry.width -
      (imageOnly ? DRAG_IMAGE_MARGIN : 0) -
      cardCssStyle.borderWidth * 2;

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
      avatarProp.geometry.height =
        newImageHeight +
        DRAG_IMAGE_MARGIN +
        cardCssStyle.borderWidth * 2 +
        document.getElementById('title')!.offsetHeight;

      avatarProp.data = imgTag;
    }
    else {
      avatarProp.geometry.height = avatarProp.geometry.height + newImageHeight;

      avatarProp.data = avatarProp.data + '<br />' + imgTag;
    }

    await window.api.setWindowSize(
      avatarProp.url,
      avatarProp.geometry.width,
      avatarProp.geometry.height
    );

    if (imageOnly) {
      saveCardColor(avatarProp, '#ffffff', '#ffffff', 0.0);
    }
    else {
      saveCard(avatarProp);
    }
    render(['TitleBar', 'CardStyle', 'ContentsData', 'ContentsRect']);

    window.api.focus(avatarProp.url);
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
    await waitUnfinishedTasks(avatarProp.url).catch((error: Error) => {
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
