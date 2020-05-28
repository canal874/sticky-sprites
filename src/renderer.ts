/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { remote, ipcRenderer } from 'electron';
import { CardProp, CardPropSerializable } from './modules_common/cardprop';

import { ICardEditor, CardCssStyle } from './modules_common/types';
import { CardEditor } from './modules_ext/editor';
import {
  render,
  initCardRenderer,
  getRenderOffsetWidth,
  getRenderOffsetHeight,
} from './modules_renderer/card_renderer';

import contextMenu = require('electron-context-menu'); // electron-context-menu uses CommonJS compatible export
import { logger } from './modules_common/utils';
import { waitUnfinishedSaveTasks, saveData } from './modules_renderer/save';

const main = remote.require('./main');

let cardProp: CardProp = new CardProp('');

let cardCssStyle: CardCssStyle = {
  padding: { left: 0, right: 0, top: 0, bottom: 0 },
  border: { left: 0, right: 0, top: 0, bottom: 0 },
};

let cardEditor: ICardEditor = new CardEditor();

const close = async () => {
  await waitUnfinishedSaveTasks();
  window.close();
};

/**
 * queueSaveCommand
 * Queuing and execute only last save command to avoid frequent save.
 */
let execSaveCommandTimeout: NodeJS.Timeout;
const execSaveCommand = () => {
  saveData(cardProp);
};

const queueSaveCommand = () => {
  clearTimeout(execSaveCommandTimeout);
  execSaveCommandTimeout = setTimeout(execSaveCommand, 1000);
};

/**
 * Context Menu
 */
const setAndSaveCardColor = (
  bgColor: string,
  titleColor?: string,
  backgroundOpacity: number = 1.0
) => {
  if (titleColor === undefined) {
    titleColor = bgColor;
  }
  cardProp.style.backgroundColor = bgColor;
  cardProp.style.titleColor = titleColor;
  cardProp.style.backgroundOpacity = backgroundOpacity;
  render(['Decoration', 'EditorColor']);

  saveData(cardProp);
};

contextMenu({
  window: remote.getCurrentWindow(),
  showSaveImageAs: true,
  showInspectElement: false,
  append: () => [
    {
      label: main.MESSAGE.yellow,
      click: () => {
        setAndSaveCardColor('#ffffa0');
      },
    },
    {
      label: main.MESSAGE.red,
      click: () => {
        setAndSaveCardColor('#ffb0b0');
      },
    },
    {
      label: main.MESSAGE.green,
      click: () => {
        setAndSaveCardColor('#d0ffd0');
      },
    },
    {
      label: main.MESSAGE.blue,
      click: () => {
        setAndSaveCardColor('#d0d0ff');
      },
    },
    {
      label: main.MESSAGE.orange,
      click: () => {
        setAndSaveCardColor('#ffb000');
      },
    },
    {
      label: main.MESSAGE.purple,
      click: () => {
        setAndSaveCardColor('#ffd0ff');
      },
    },
    {
      label: main.MESSAGE.white,
      click: () => {
        setAndSaveCardColor('#ffffff');
      },
    },
    {
      label: main.MESSAGE.gray,
      click: () => {
        setAndSaveCardColor('#d0d0d0');
      },
    },
    {
      label: main.MESSAGE.transparent,
      click: () => {
        setAndSaveCardColor('#ffffff', '#ffffff', 0.0);
      },
    },
  ],
});

/**
 * Initialize
 */
const initializeUIEvents = () => {
  document.ondragover = e => {
    e.preventDefault();
    return false;
  };

  document.ondrop = e => {
    e.preventDefault();

    var file = e.dataTransfer?.files[0];

    var dropImg = new Image();
    if (file) {
      dropImg.onload = () => {
        var width = dropImg.naturalWidth;
        var height = dropImg.naturalHeight;

        // TODO:
        // Adjust img to card size
        // ...
        // ...

        cardProp.data =
          '<img src="' +
          file!.path +
          '" width="' +
          width +
          '" height="' +
          height +
          '">';
        render(['ContentsData']);
      };
      dropImg.src = file.path;
    }
    return false;
  };

  document.getElementById('newBtn')?.addEventListener('click', () => {
    main.createCard();
  });

  document.getElementById('contents')?.addEventListener('click', async () => {
    // 'contents' can be clicked when cardEditor.editorType is 'Markup'
    if (window.getSelection()?.toString() != '') {
      return;
    }
    else {
      await cardEditor.showEditor().catch(e => {
        logger.error(`Error in clicking contents: ${e}`);
      });
      cardEditor.startEdit();
    }
  });

  document.getElementById('codeBtn')?.addEventListener('click', () => {
    cardEditor.toggleCodeMode();
  });

  document.getElementById('closeBtn')?.addEventListener('click', () => {
    if (cardEditor.isOpened) {
      if (cardEditor.editorType == 'Markup') {
        cardEditor.hideEditor();
      }
      const [dataChanged, data] = cardEditor.endEdit();
      cardProp.data = data;
      render(['ContentsData', 'ContentsRect']);
      if (dataChanged && cardProp.data != '') {
        saveData(cardProp);
      }
    }
    if (cardProp.data == '') {
      main.deleteCard(cardProp);
    }
    else {
      /**
       * Don't use window.confirm(main.MESSAGE.confirm_closing)
       * It disturbs correct behavior of CKEditor.
       * Caret of CKEditor is disappeared just after push Cancel button of window.confirm()
       */
      remote.dialog
        .showMessageBox(remote.getCurrentWindow(), {
          type: 'question',
          buttons: [main.MESSAGE.btnCloseCard, 'Cancel'],
          defaultId: 0,
          cancelId: 1,
          message: main.MESSAGE.confirmClosing,
        })
        .then(res => {
          if (res.response == 0) {
            // OK
            close();
          }
          else if (res.response == 1) {
            // Cancel
          }
        })
        .catch(e => {
          logger.debug(e);
        });
    }
  });
};

const onload = async () => {
  window.removeEventListener('load', onload, false);

  cardCssStyle = {
    padding: {
      left: parseInt(
        window.getComputedStyle(document.getElementById('contents')!)
          .paddingLeft
      ),
      right: parseInt(
        window.getComputedStyle(document.getElementById('contents')!)
          .paddingRight
      ),
      top: parseInt(
        window.getComputedStyle(document.getElementById('contents')!).paddingTop
      ),
      bottom: parseInt(
        window.getComputedStyle(document.getElementById('contents')!)
          .paddingBottom
      ),
    },
    border: {
      left: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderLeft
      ),
      right: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderRight
      ),
      top: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderTop
      ),
      bottom: parseInt(
        window.getComputedStyle(document.getElementById('card')!).borderBottom
      ),
    },
  };

  initializeUIEvents();

  await cardEditor.loadUI(cardCssStyle);
  ipcRenderer.send('finish-load');
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

      render();

      if (cardEditor.editorType == 'WYSIWYG') {
        cardEditor.showEditor().catch(e => {
          logger.error(`Error in render-card: ${e}`);
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
    render(['Decoration']);

    if (cardEditor.editorType == 'WYSIWYG') {
      cardEditor.startEdit();
    }
  });

  ipcRenderer.on('card-blurred', () => {
    console.debug('card-blurred');

    cardProp.status = 'Blurred';
    render(['Decoration']);

    if (cardEditor.isOpened) {
      if (cardEditor.editorType == 'Markup') {
        cardEditor.hideEditor();
      }
      const [dataChanged, data] = cardEditor.endEdit();
      if (dataChanged) {
        cardProp.data = data;
        render(['ContentsData', 'ContentsRect']);
        saveData(cardProp);
      }
    }
  });

  ipcRenderer.on(
    'resize-by-hand',
    (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
      cardProp.rect.width = newBounds.width + getRenderOffsetWidth();
      cardProp.rect.height = newBounds.height + getRenderOffsetHeight();

      render(['TitleBar', 'ContentsRect', 'EditorRect']);

      queueSaveCommand();
    }
  );

  ipcRenderer.on(
    'move-by-hand',
    (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
      cardProp.rect.x = newBounds.x;
      cardProp.rect.y = newBounds.y;

      queueSaveCommand();
    }
  );
};

initializeIPCEvents();
window.addEventListener('load', onload, false);
