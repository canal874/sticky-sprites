/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import { CardProp, ICardEditor, CardPropSerializable, Rectangle, CardCssStyle } from './modules_common/types';
import { CardEditor } from './modules_ext/editor';
import { render, initCardRenderer, getRenderOffsetWidth, getRenderOffsetHeight, CardRenderOptions } from './card_renderer';
import contextMenu = require('electron-context-menu'); // electron-context-menu uses CommonJS compatible export

const main = remote.require('./main');

let cardProp: CardProp = new CardProp('');

let cardCssStyle: CardCssStyle = { padding: { left: 0, right: 0, top: 0, bottom: 0 }, border: { left: 0, right: 0, top: 0, bottom: 0 }}

let cardEditor: ICardEditor = new CardEditor();

const close = () => {
  window.close();
};

const setAndSaveCardColor = (bgColor: string, bgOpacity: number = 1.0) => {
  cardProp.style.backgroundColor = bgColor;
  cardProp.style.backgroundOpacity = bgOpacity;
  render([CardRenderOptions.Color]);

  cardEditor.setColor(cardProp.style.backgroundColor, cardProp.style.titleColor);

  main.saveCard(cardProp);
};

contextMenu({
  window: remote.getCurrentWindow(),
  showSaveImageAs: true,
  showInspectElement: false,
  append: (defaultActions, params, browserWindow) => [
    { label: main.MESSAGE.white, click: () => { setAndSaveCardColor('#ffffff'); } },    
    { label: main.MESSAGE.yellow, click: () => { setAndSaveCardColor('#ffffa0'); } },
    { label: main.MESSAGE.red, click: () => { setAndSaveCardColor('#ffd0d0'); } },
    { label: main.MESSAGE.green, click: () => { setAndSaveCardColor('#d0ffd0'); } },
    { label: main.MESSAGE.blue, click: () => { setAndSaveCardColor('#d0d0ff'); } },
    { label: main.MESSAGE.purple, click: () => { setAndSaveCardColor('#ffd0ff'); } },
    { label: main.MESSAGE.gray, click: () => { setAndSaveCardColor('#d0d0d0'); } },
    { label: main.MESSAGE.transparent, click: () => { setAndSaveCardColor('#ffffff', 0.0); } }
  ]
});

const initializeUIEvents = () => {
  document.ondragover = (e) => {
    e.preventDefault();
    return false;
  };

  document.ondrop = (e) => {
    e.preventDefault();

    var file = e.dataTransfer.files[0];

    var dropImg = new Image();
    dropImg.onload = () => {
      var width = dropImg.naturalWidth;
      var height = dropImg.naturalHeight;

      // TODO:
      // Adjust img to card size
      // ...
      // ...

      var data = '<img src="'+ file.path + '" width="' + width + '" height="' + height + '"';
      CKEDITOR.instances['editor'].setData(data);
      document.getElementById('contents').innerHTML = data;
    };
    dropImg.src = file.path;

    return false;
  };


  document.getElementById('newBtn').addEventListener('click', () => {
    main.createCard();
  });

  document.getElementById('contents').addEventListener('click', () => {
    if(window.getSelection().toString() != ''){
      return;
    }
    else{
      cardEditor.startEditMode();
    }
  });

  document.getElementById('codeBtn').addEventListener('click', () => {
    cardEditor.toggleCodeMode();
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    cardProp.data = CKEDITOR.instances['editor'].getData();
    if (cardProp.data == '') {
      main.saveToCloseCard(cardProp);
      
    }
    else if (window.confirm(main.MESSAGE.confirm_closing)) {
      main.saveToCloseCard(cardProp);
    }
  });

}

/**
 * queueSaveCommand 
 * Queuing and execute only last save command to avoid frequent save.
 */
let execSaveCommandTimeout: NodeJS.Timeout = null;
const execSaveCommand = () => {
  cardProp.data = CKEDITOR.instances['editor'].getData();
  main.saveCard(cardProp);
};

const queueSaveCommand = () => {
  clearTimeout(execSaveCommandTimeout);
  execSaveCommandTimeout = setTimeout(execSaveCommand, 1000);
}

/**
 * Initialize
 */

const onloaded = () => {
  window.removeEventListener('load', onloaded, false);

  cardCssStyle = {
    padding: {
      left: parseInt(window.getComputedStyle(document.getElementById('contents')).paddingLeft),
      right: parseInt(window.getComputedStyle(document.getElementById('contents')).paddingRight),
      top: parseInt(window.getComputedStyle(document.getElementById('contents')).paddingTop),
      bottom: parseInt(window.getComputedStyle(document.getElementById('contents')).paddingBottom),
    },
    border: {
      left: parseInt(window.getComputedStyle(document.getElementById('card')).borderLeft),
      right: parseInt(window.getComputedStyle(document.getElementById('card')).borderRight),
      top: parseInt(window.getComputedStyle(document.getElementById('card')).borderTop),
      bottom: parseInt(window.getComputedStyle(document.getElementById('card')).borderBottom)
    }
  };

  cardEditor.loadUI(cardCssStyle).then(() => {
    initializeUIEvents();
    ipcRenderer.send('finish-load');
  }
  );
}


const initializeIPCEvents = () => {
  // ipc (inter-process communication)

  // Render card data
  ipcRenderer.on('render-card', (event: Electron.IpcRendererEvent, _prop: CardPropSerializable) => {
    cardProp = CardProp.deserialize(_prop);

    initCardRenderer(cardProp, cardCssStyle, cardEditor);
    render();

    cardEditor.loadCard(cardProp);

    document.getElementById('card').style.visibility = 'visible';
  });

  ipcRenderer.on('card-close', (event: Electron.IpcRendererEvent) => {
    close();
  });

  ipcRenderer.on('card-focused', (event: Electron.IpcRendererEvent) => {
    document.getElementById('card').style.border = '3px solid red';
    document.getElementById('title').style.visibility = 'visible';
  });
  
  ipcRenderer.on('card-blured', (event: Electron.IpcRendererEvent) => {
    if(document.getElementById('contents').style.visibility == 'hidden'){
      cardEditor.endEditMode();
    }
    document.getElementById('card').style.border = '3px solid transparent';
    if(cardProp.style.backgroundOpacity == 0){
      document.getElementById('title').style.visibility = 'hidden';
    }
  });

  ipcRenderer.on('resize-byhand', (event: Electron.IpcRendererEvent, newBounds: Rectangle) => {
    cardProp.rect.width = newBounds.width + getRenderOffsetWidth();
    cardProp.rect.height = newBounds.height + getRenderOffsetHeight();

    render([CardRenderOptions.TitleBar, CardRenderOptions.ContentsSize, CardRenderOptions.EditorSize]);

    queueSaveCommand();
  });

  ipcRenderer.on('move-byhand', (newBounds: Electron.IpcRendererEvent) => {
    queueSaveCommand();
  });
};

/** This script is inserted at the last part of <html> element */
initializeIPCEvents();
window.addEventListener('load', onloaded, false);