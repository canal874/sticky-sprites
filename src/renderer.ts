/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { ipcRenderer, remote } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import contextMenu from 'electron-context-menu';
import {
  CardProp,
  CardPropSerializable,
  DEFAULT_CARD_GEOMETRY,
  DRAG_IMAGE_MARGIN,
} from './modules_common/cardprop';
import { CardCssStyle, DialogButton, ICardEditor } from './modules_common/types';
import { CardEditor } from './modules_ext/editor';
import {
  getRenderOffsetHeight,
  getRenderOffsetWidth,
  initCardRenderer,
  MESSAGE,
  render,
  UI_COLOR_DARKENING_RATE,
} from './modules_renderer/card_renderer';
import { darkenHexColor, getImageTag, logger } from './modules_common/utils';
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
  document.addEventListener('dragover', e => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('drop', e => {
    e.preventDefault();

    const file = e.dataTransfer?.files[0];

    const dropImg = new Image();
    if (file) {
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

        const imgTag = getImageTag(
          uuidv4(),
          file!.path,
          newImageWidth,
          newImageHeight,
          file!.name
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
          logger.error(`Error in clicking contents: ${err.message}`);
        });
        cardEditor.startEdit();
      });

      dropImg.src = file.path;
    }
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
  document.getElementById('contents')?.addEventListener('click', async event => {
    // 'contents' can be clicked when cardEditor.editorType is 'Markup'
    if (window.getSelection()?.toString() === '') {
      await cardEditor.showEditor().catch((e: Error) => {
        logger.error(`Error in clicking contents: ${e.message}`);
      });
      cardEditor.startEdit();

      ipcRenderer.invoke('send-mouse-input', cardProp.id, event.clientX, event.clientY);
    }
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
    if (cardProp.data === '') {
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

  initializeUIEvents();

  await cardEditor.loadUI(cardCssStyle);
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

initializeIPCEvents();
window.addEventListener('load', onload, false);
