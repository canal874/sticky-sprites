/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import { CardProp, CardPropSerializable } from './modules_common/card';
import { ICardEditor, CardCssStyle } from './modules_common/types';
import { CardEditor } from './modules_ext/editor';
import { render, initCardRenderer, getRenderOffsetWidth, getRenderOffsetHeight, CardRenderOptions } from './card_renderer';
import contextMenu = require('electron-context-menu'); // electron-context-menu uses CommonJS compatible export
import { logger, getCurrentDate } from './modules_common/utils';

const main = remote.require('./main');

let cardProp: CardProp = new CardProp('');

let cardCssStyle: CardCssStyle = { padding: { left: 0, right: 0, top: 0, bottom: 0 }, border: { left: 0, right: 0, top: 0, bottom: 0 } }

let cardEditor: ICardEditor = new CardEditor();

let unfinishedSaveTasks: Array<CardPropSerializable> = new Array();

const waitUnfinishedSaveTasks = () => {
  return new Promise((resolve, reject) => {
    if(unfinishedSaveTasks.length > 0) {
      let timeoutCounter = 0;
      const timer = setInterval(() => {
        if(unfinishedSaveTasks.length == 0) {
          clearInterval(timer);
          resolve();
        }
        else if(timeoutCounter >= 10) {

          const res = remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Ok', 'Cancel'],
            defaultId: 0,
            cancelId: 1,
            message: main.MESSAGE.confirm_wait_more
          })
          if(res == 0){
            // OK
            timeoutCounter = 0;
          }
          else if(res == 1){
            // Cancel
            clearInterval(timer);            
            reject();
          }
        }
        timeoutCounter++;
      }, 500);
    }
    else {
      resolve();
    }
  });
}
const close = async () => {
  await waitUnfinishedSaveTasks();
  window.close();  
};

const setTitleMessage = (msg: string) => {
  if(document.getElementById('titleMessage')){
    document.getElementById('titleMessage')!.innerHTML = msg;
  }
}

/**
 * Save
 */
const execSaveTask = async () => {
  if(unfinishedSaveTasks.length == 1) {
    const timeout = setTimeout(() => {
      setTitleMessage('[saving...]');
    }, 1000);

    // Execute the first task
    await ipcRenderer.invoke('save', unfinishedSaveTasks[0]).catch((e) => {
      // TODO: Handle save error.
    });
    const finishedPropObject = unfinishedSaveTasks.shift();
    logger.debug(`Dequeue unfinishedSaveTask: ${finishedPropObject?.modified_date}`);
    clearTimeout(timeout);
    setTitleMessage('');
    if(unfinishedSaveTasks.length > 0) {
      execSaveTask();
    }
  }
};

const saveData = () => {
  cardProp.date.modified_date = getCurrentDate();
  const propObject = cardProp.toObject();
  while(unfinishedSaveTasks.length > 1){
    const poppedPropObject = unfinishedSaveTasks.pop();
    logger.debug(`Skip unfinishedSaveTask: ${poppedPropObject?.modified_date}`);
  }
  logger.debug(`Enqueue unfinishedSaveTask: ${propObject.modified_date}`);
  // Here, current length of unfinishedSaveTasks should be 0 or 1.
  unfinishedSaveTasks.push(propObject);
  // Here, current length of unfinishedSaveTasks is 1 or 2.
  execSaveTask();
}

const setAndSaveCardColor = (bgColor: string, bgOpacity: number = 1.0) => {
  cardProp.style.backgroundColor = bgColor;
  cardProp.style.backgroundOpacity = bgOpacity;
  render([CardRenderOptions.Color]);

  cardEditor.setColor(cardProp.style.backgroundColor, cardProp.style.titleColor);

  saveData();
};

/**
 * queueSaveCommand 
 * Queuing and execute only last save command to avoid frequent save.
 */
let execSaveCommandTimeout: NodeJS.Timeout;
const execSaveCommand = () => {
  saveData();
};

const queueSaveCommand = () => {
  clearTimeout(execSaveCommandTimeout);
  execSaveCommandTimeout = setTimeout(execSaveCommand, 1000);
}

/**
 * Context Menu
 */
contextMenu({
  window: remote.getCurrentWindow(),
  showSaveImageAs: true,
  showInspectElement: false,
  append: (defaultActions, params, browserWindow) => [
    { label: main.MESSAGE.white, click: () => { setAndSaveCardColor('#ffffff'); } },
    { label: main.MESSAGE.yellow, click: () => { setAndSaveCardColor('#ffffa0'); } },
    { label: main.MESSAGE.red, click: () => { setAndSaveCardColor('#ffb0b0'); } },
    { label: main.MESSAGE.green, click: () => { setAndSaveCardColor('#d0ffd0'); } },
    { label: main.MESSAGE.blue, click: () => { setAndSaveCardColor('#d0d0ff'); } },
    { label: main.MESSAGE.orange, click: () => { setAndSaveCardColor('#ffb000'); } },
    { label: main.MESSAGE.purple, click: () => { setAndSaveCardColor('#ffd0ff'); } },
    { label: main.MESSAGE.gray, click: () => { setAndSaveCardColor('#d0d0d0'); } },
    { label: main.MESSAGE.transparent, click: () => { setAndSaveCardColor('#ffffff', 0.0); } }
  ]
});


/**
 * Initialize
 */
const initializeUIEvents = () => {
  document.ondragover = (e) => {
    e.preventDefault();
    return false;
  };

  document.ondrop = (e) => {
    e.preventDefault();

    var file = e.dataTransfer?.files[0];

    var dropImg = new Image();
    if(file) {
      dropImg.onload = () => {
        var width = dropImg.naturalWidth;
        var height = dropImg.naturalHeight;

        // TODO:
        // Adjust img to card size
        // ...
        // ...

        cardProp.data = '<img src="' + file!.path + '" width="' + width + '" height="' + height + '">';
        render([CardRenderOptions.ContentsData]);
      };
      dropImg.src = file.path;
    }
    return false;
  };


  document.getElementById('newBtn')?.addEventListener('click', () => {
    main.createCard();
  });

  document.getElementById('contents')?.addEventListener('click', () => {
    if(window.getSelection()?.toString() != '') {
      return;
    }
    else {
      cardEditor.startEdit();
    }
  });

  document.getElementById('codeBtn')?.addEventListener('click', () => {
    cardEditor.toggleCodeMode();
  });

  document.getElementById('closeBtn')?.addEventListener('click', () => {
    if(cardEditor.isOpened) {
      const [dataChanged, data] = cardEditor.endEdit()
      cardProp.data = data;      
      if(dataChanged && cardProp.data != '') {  
        render([CardRenderOptions.ContentsData, CardRenderOptions.ContentsSize]);
        saveData();
      }
    }
    if(cardProp.data == '') {
      main.deleteCard(cardProp);
    }
    else{
      /**
       * Don't use window.confirm(main.MESSAGE.confirm_closing)
       * It disturbs correct behavior of CKEditor.
       * Caret of CKEditor is disappeared just after push Cancel button of window.confirm()
       */
      remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'question',
        buttons: [main.MESSAGE.btn_close_card, 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        message: main.MESSAGE.confirm_closing
      }).then((res) => {
        if(res.response == 0){
          // OK
          close();
        }
        else if(res.response == 1){
          // Cancel
        }
      }).catch((e) => {
        logger.debug(e);
      });
    }

  });

}

const onloaded = async () => {
  window.removeEventListener('load', onloaded, false);

  cardCssStyle = {
    padding: {
      left: parseInt(window.getComputedStyle(document.getElementById('contents')!).paddingLeft),
      right: parseInt(window.getComputedStyle(document.getElementById('contents')!).paddingRight),
      top: parseInt(window.getComputedStyle(document.getElementById('contents')!).paddingTop),
      bottom: parseInt(window.getComputedStyle(document.getElementById('contents')!).paddingBottom),
    },
    border: {
      left: parseInt(window.getComputedStyle(document.getElementById('card')!).borderLeft),
      right: parseInt(window.getComputedStyle(document.getElementById('card')!).borderRight),
      top: parseInt(window.getComputedStyle(document.getElementById('card')!).borderTop),
      bottom: parseInt(window.getComputedStyle(document.getElementById('card')!).borderBottom)
    }
  };

  initializeUIEvents();

  await cardEditor.loadUI(cardCssStyle);
  ipcRenderer.send('finish-load');
}

const initializeIPCEvents = () => {
  // ipc (inter-process communication)

  // Render card data
  ipcRenderer.on('render-card', (event: Electron.IpcRendererEvent, _prop: CardPropSerializable) => {
    cardProp = CardProp.fromObject(_prop);

    initCardRenderer(cardProp, cardCssStyle, cardEditor);
    render();

    cardEditor.loadCard(cardProp);

    if(cardProp.style.backgroundOpacity == 0) {
      document.getElementById('title')!.style.visibility = 'hidden';
    }
    document.getElementById('card')!.style.visibility = 'visible';
  });

  ipcRenderer.on('card-close', (event: Electron.IpcRendererEvent) => {
    close();
  });

  ipcRenderer.on('card-focused', (event: Electron.IpcRendererEvent) => {
    logger.debug('card-focused');
    document.getElementById('card')!.style.border = '3px solid red';
    document.getElementById('title')!.style.visibility = 'visible';
  });

  ipcRenderer.on('card-blured', (event: Electron.IpcRendererEvent) => {
    logger.debug('card-blured');
    if(cardEditor.isOpened) {
      const [dataChanged, data] = cardEditor.endEdit()
      if(dataChanged) {
        cardProp.data = data;
        render([CardRenderOptions.ContentsData, CardRenderOptions.ContentsSize]);
        saveData();
      }
    }
    document.getElementById('card')!.style.border = '3px solid transparent';
    if(cardProp.style.backgroundOpacity == 0) {
      document.getElementById('title')!.style.visibility = 'hidden';
    }
  });

  ipcRenderer.on('resize-byhand', (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
    cardProp.rect.width = newBounds.width + getRenderOffsetWidth();
    cardProp.rect.height = newBounds.height + getRenderOffsetHeight();

    render([CardRenderOptions.TitleBar, CardRenderOptions.ContentsSize, CardRenderOptions.EditorSize]);

    queueSaveCommand();
  });

  ipcRenderer.on('move-byhand', (event: Electron.IpcRendererEvent, newBounds: Electron.Rectangle) => {
    cardProp.rect.x = newBounds.x;
    cardProp.rect.y = newBounds.y;

    queueSaveCommand();
  });
};

initializeIPCEvents();
window.addEventListener('load', onloaded, false);