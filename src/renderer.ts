/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import { CardProp, ICardEditor, CardPropSerializable } from './modules_common/types';
import { CardEditor } from './modules_ext/editor';
import contextMenu = require('electron-context-menu'); // electron-context-menu uses CommonJS compatible export

const main = remote.require('./main');

let cardEditor: ICardEditor;

let cardProp: CardProp;


const close = () => {
  window.close();
};


const resizeCard = () => {
  if(window.innerWidth < main.getMinimumWindowWidth()){
    // CSS has not been rendered yet.
    console.log('retry resize..');
    setTimeout(resizeCard, 500);
    return;
  }

  const cardBorder = parseInt(window.getComputedStyle(document.getElementById('card')).borderLeft);
  const cardWidth = window.innerWidth - cardBorder * 2;
  const cardHeight = window.innerHeight - cardBorder * 2;

  const contPadding = parseInt(window.getComputedStyle(document.getElementById('contents')).paddingLeft);
  document.getElementById('contents').style.width = (cardWidth - contPadding * 2) + 'px';
  document.getElementById('contents').style.height = (cardHeight - document.getElementById('titleBar').offsetHeight - contPadding * 2) + 'px';

  if (cardEditor && cardEditor.isEditorReady) {
    cardEditor.setSize(cardWidth, cardHeight);
  }

  const closeBtnLeft = cardWidth - document.getElementById('closeBtn').offsetWidth;
  document.getElementById('closeBtn').style.left = closeBtnLeft + 'px';
  const titleBarLeft = document.getElementById('codeBtn').offsetLeft + document.getElementById('codeBtn').offsetWidth;
  const barwidth = closeBtnLeft - titleBarLeft;
  document.getElementById('titleBar').style.left = titleBarLeft + 'px';
  document.getElementById('titleBar').style.width = barwidth + 'px';

};

const setAndSaveCardColor = (bgColor: string, bgOpacity: number = 1.0) => {
  setCardColor(bgColor, bgOpacity);
  cardProp.data = CKEDITOR.instances['editor'].getData();
  main.saveCard(cardProp)    
};

const setCardColor = (bgColor: string, bgOpacity: number = 1.0) => {
  // Set card properties
  // cardColor : #HEX (e.g. #ff00ff)
  // cardColor : 0.0-1.0

  cardProp.style.backgroundColor = bgColor;
  cardProp.style.backgroundOpacity = bgOpacity;
  let scale = 0.8;
  bgColor.match(/#(\w\w)(\w\w)(\w\w)/);
  let red = parseInt(RegExp.$1, 16);
  let green = parseInt(RegExp.$2, 16);
  let blue = parseInt(RegExp.$3, 16);
  document.getElementById('contents').style.backgroundColor = 'rgba(' + red + ',' + green + ',' + blue + ',' + cardProp.style.backgroundOpacity + ')';
  
  let r = Math.floor(red * scale).toString(16);
  if (r.length == 1) { r = '0' + r; }
  let g = Math.floor(green * scale).toString(16);
  if (g.length == 1) { g = '0' + g; }
  let b = Math.floor(blue * scale).toString(16);
  if (b.length == 1) { b = '0' + b; }
  cardProp.style.titleColor = '#' + r + g + b;

  Array.from(document.getElementsByClassName('title-color')).forEach((node, index, list) =>  {
    (node as HTMLElement).style.backgroundColor = cardProp.style.titleColor;
  });

  if (cardEditor && cardEditor.isEditorReady) {
    document.getElementById('cke_editor').style.borderTopColor
      = document.getElementById('cke_1_bottom').style.backgroundColor
      = document.getElementById('cke_1_bottom').style.borderBottomColor
      = document.getElementById('cke_1_bottom').style.borderTopColor
      = cardProp.style.titleColor;
    (document.querySelector('#cke_1_contents .cke_wysiwyg_frame') as HTMLElement).style.backgroundColor = cardProp.style.backgroundColor;
  }
};

contextMenu({
  window: remote.getCurrentWindow(),
  showSaveImageAs: true,
  showInspectElement: false,
  append: (defaultActions, params, browserWindow) => [
    { label: main.MESSAGE.yellow, click: () => { setAndSaveCardColor('#ffffa0'); } },
    { label: main.MESSAGE.red, click: () => { setAndSaveCardColor('#ffd0d0'); } },
    { label: main.MESSAGE.green, click: () => { setAndSaveCardColor('#d0ffd0'); } },
    { label: main.MESSAGE.blue, click: () => { setAndSaveCardColor('#d0d0ff'); } },
    { label: main.MESSAGE.purple, click: () => { setAndSaveCardColor('#ffd0ff'); } },
    { label: main.MESSAGE.gray, click: () => { setAndSaveCardColor('#d0d0d0'); } },
    { label: main.MESSAGE.transparent, click: () => { setAndSaveCardColor('#f0f0f0', 0.0); } }
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

const initializeIPCEvents = () => {
  // ipc (inter-process communication)

  // Initialize card
  ipcRenderer.on('card-loaded', (event: Electron.IpcRendererEvent, _prop: CardPropSerializable) => {
    cardProp = CardProp.deserialize(_prop);
    setCardColor(cardProp.style.backgroundColor, cardProp.style.backgroundOpacity);

    cardEditor = new CardEditor(cardProp);

    setTimeout(()=>{
      document.getElementById('card').style.visibility = 'visible';
      resizeCard();
    },300);
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

  ipcRenderer.on('resize-byhand', (newBounds: Electron.IpcRendererEvent) => {
    resizeCard();
    queueSaveCommand();
  });

  ipcRenderer.on('move-byhand', (newBounds: Electron.IpcRendererEvent) => {
    queueSaveCommand();
  });
  
  ipcRenderer.send('dom-loaded', remote.getCurrentWindow().getTitle());
};

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
  window.addEventListener('resize', () => {
    if(cardEditor && cardEditor.resizedByCode){
      cardEditor.resizedByCode = false;
      resizeCard();
    }
  }, false);

  initializeUIEvents();
  // Card must be loaded after CSS is rendered. 
  initializeIPCEvents();
}

/** This script is inserted at the last part of <html> element */
window.addEventListener('load', onloaded, false);