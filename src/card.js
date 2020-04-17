/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const main = require('electron').remote.require('./main');
const ipcRenderer = require( 'electron' ).ipcRenderer;
const {remote} = require('electron');
const {Menu, MenuItem} = remote;

const card = { id: '' };

let codeMode = false;

let toolbarHeight = 64;

let currentCardColor = '#f0f0a0';
let currentTitleColor = '#d0d090';
let currentBgOpacity = 1.0;

let isEditorReady = false;

const close = () => {
  window.close();
};


/**
 * Editor 
 */

const moveCursorToBottom = () => {
  let editor = CKEDITOR.instances['editor'];
  let s = editor.getSelection(); // getting selection
  let selected_ranges = s.getRanges(); // getting ranges
  if (selected_ranges.length > 0) {
    let node = selected_ranges[0].startContainer; // selecting the starting node
    let parents = node.getParents(true);
    node = parents[parents.length - 2].getFirst();
    while (true) {
      let x = node.getNext();
      if (x == null) {
        break;
      }
      node = x;
    }

    s.selectElement(node);
    selected_ranges = s.getRanges();
    selected_ranges[0].collapse(false);  //  false collapses the range to the end of the selected node, true before the node.
    s.selectRanges(selected_ranges);  // putting the current selection there
  }
};

const startEditMode = () => {
  document.getElementById('contents').style.visibility = 'hidden';
  document.getElementById('cke_editor').style.visibility = 'visible';

  execAfterWysiwygChanged(
    function () {
      resizeWindow();
      CKEDITOR.instances['editor'].focus();
      moveCursorToBottom();
    }
  );
};

const endEditMode = () => {
  let data = CKEDITOR.instances['editor'].getData();
  document.getElementById('contents').innerHTML = data;
  document.getElementById('contents').style.visibility = 'visible';
  setTimeout(() => {
    main.saveCard(card.id, data, currentCardColor, currentBgOpacity);
  }, 1);
  document.getElementById('cke_editor').style.visibility = 'hidden';

  codeMode = false;
  document.getElementById('codeBtn').style.color = '#000000';
  CKEDITOR.instances['editor'].setMode('wysiwyg');
};

const startCodeMode = () => {
  codeMode = true;
  startEditMode();
  document.getElementById('codeBtn').style.color = '#a0a0a0';
  CKEDITOR.instances['editor'].setMode('source');
  CKEDITOR.instances['editor'].focus();
};

const execAfterWysiwygChanged = (func) => {
  let editor = CKEDITOR.instances['editor'];
  let s = editor.getSelection(); // getting selection
  if (s) {
    func();
  }
  else {
    setTimeout(() => { execAfterWysiwygChanged(func) }, 100);
  }
};

const endCodeMode = () => {
  codeMode = false;
  document.getElementById('codeBtn').style.color = '#000000';
  CKEDITOR.instances['editor'].setMode('wysiwyg');
  execAfterWysiwygChanged(
    function () {
      CKEDITOR.instances['editor'].focus();
      moveCursorToBottom();
    }
  );
};


const resizeWindow = () => {
  if(window.innerWidth < main.getMinimumWindowWidth()){
    // CSS has not been rendered yet.
    console.log('retry resize..');
    setTimeout(resizeWindow, 500);
    return;
  }
  var cardBorder = parseInt(window.getComputedStyle(document.getElementById('card')).borderLeft);
  var cardWidth = window.innerWidth - cardBorder * 2;
  var cardHeight = window.innerHeight - cardBorder * 2;

  var contPadding = parseInt(window.getComputedStyle(document.getElementById('contents')).paddingLeft);
  document.getElementById('contents').style.width = (cardWidth - contPadding * 2) + 'px';
  document.getElementById('contents').style.height = (cardHeight - document.getElementById('titleBar').offsetHeight - contPadding * 2) + 'px';

  if (isEditorReady) {
    CKEDITOR.instances['editor'].resize(cardWidth, cardHeight - document.getElementById('titleBar').offsetHeight);
  }

  let closeBtnLeft = cardWidth - document.getElementById('closeBtn').offsetWidth;
  document.getElementById('closeBtn').style.left = closeBtnLeft + 'px';
  let titleBarLeft = document.getElementById('codeBtn').offsetLeft + document.getElementById('codeBtn').offsetWidth;
  let barwidth = closeBtnLeft - titleBarLeft;
  document.getElementById('titleBar').style.left = titleBarLeft + 'px';
  document.getElementById('titleBar').style.width = barwidth + 'px';
};

const setCardColor = (cardColor, bgOpacity) => {
  // Set card properties
  // cardColor : #HEX (e.g. #ff00ff)
  // cardColor : 0.0-1.0

  currentCardColor = cardColor;
  currentBgOpacity = bgOpacity === undefined ? 1.0 : bgOpacity;
  let scale = 0.8;
  cardColor.match(/#(\w\w)(\w\w)(\w\w)/)
  let red = parseInt(RegExp.$1, 16);
  let green = parseInt(RegExp.$2, 16);
  let blue = parseInt(RegExp.$3, 16);
  document.getElementById('contents').style.backgroundColor = 'rgba(' + red + ',' + green + ',' + blue + ',' + currentBgOpacity + ')';
  
  let r = Math.floor(red * scale).toString(16);
  if (r.length == 1) { r = '0' + r; }
  let g = Math.floor(green * scale).toString(16);
  if (g.length == 1) { g = '0' + g; }
  let b = Math.floor(blue * scale).toString(16);
  if (b.length == 1) { b = '0' + b; }
  currentTitleColor = '#' + r + g + b;

  Array.from(document.getElementsByClassName('title-color')).forEach((node, index, list) =>  {
    node.style.backgroundColor = currentTitleColor;
  });

  if (isEditorReady) {
    document.getElementById('cke_editor').style.borderTopColor = currentTitleColor;
    document.getElementById('cke_1_bottom').style.backgroundColor = currentTitleColor;
    document.getElementById('cke_1_bottom').style.borderBottomColor = currentTitleColor;
    document.getElementById('cke_1_bottom').style.borderTopColor = currentTitleColor;
    document.querySelector('#cke_1_contents .cke_wysiwyg_frame').style.backgroundColor = currentCardColor;
  }
};

const createContextMenu = () => {
  const menu = new Menu();
  menu.append(new MenuItem({ label: main.i18n('yellow'), click: () => { setCardColor('#ffffa0'); } }));
  menu.append(new MenuItem({ label: main.i18n('red'), click: () => { setCardColor('#ffd0d0'); } }));
  menu.append(new MenuItem({ label: main.i18n('green'), click: () => { setCardColor('#d0ffd0'); } }));
  menu.append(new MenuItem({ label: main.i18n('blue'), click: () => { setCardColor('#d0d0ff'); } }));
  menu.append(new MenuItem({ label: main.i18n('purple'), click: () => { setCardColor('#ffd0ff'); } }));
  menu.append(new MenuItem({ label: main.i18n('gray'), click: () => { setCardColor('#d0d0d0'); } }));
  menu.append(new MenuItem({ label: main.i18n('transparent'), click: () => { setCardColor('#f0f0f0', 0.0); } }));
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
  }, false);
};

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
    startEditMode();
  });

  document.getElementById('codeBtn').addEventListener('click', () => {
    if (!codeMode) {
      startCodeMode();
    }
    else {
      endCodeMode();
    }
  });

  document.getElementById('closeBtn').click(() => {
    let data = CKEDITOR.instances['editor'].getData();
    if (data == '') {
      main.saveToCloseCard(card.id, data, currentCardColor, currentBgOpacity);
    }
    else if (window.confirm(main.i18n('confirm-closing'))) {
      main.saveToCloseCard(card.id, data, currentCardColor, currentBgOpacity);
    }
  });

}

const initializeIPCEvents = () => {
  // ipc (inter-process communication)

  // Initialize card
  ipcRenderer.on('card-loaded', (event, id, data, x, y,  width, height, color, bgOpacity) => {
    card.id = id;
    Object.freeze(card);
    
    document.getElementById('editor').innerHTML = data;
    document.getElementById('contents').innerHTML = data;

    setCardColor(color, bgOpacity);

    var sprBorder = parseInt(window.getComputedStyle(document.getElementById('card')).borderLeft);
    var sprWidth = width - sprBorder*2;
    var sprHeight = height - sprBorder*2;
    CKEDITOR.config.width =  sprWidth;
    CKEDITOR.config.height =  sprHeight - document.getElementById('titleBar').offsetHeight - toolbarHeight; 
    resizeWindow();

//    CKEDITOR.config.uiColor = currentTitleColor;
    CKEDITOR.replace('editor'); 
    CKEDITOR.on('instanceReady', () => {
      isEditorReady = true;
      document.getElementById('cke_editor').style.borderTopColor = currentTitleColor;      
      document.getElementById('cke_1_bottom').style.backgroundColor = currentTitleColor;
      document.getElementById('cke_1_bottom').style.borderBottomColor = currentTitleColor;
      document.getElementById('cke_1_bottom').style.borderTopColor = currentTitleColor;
      document.querySelector('#cke_1_contents .cke_wysiwyg_frame').style.backgroundColor = currentCardColor;
    });

    setTimeout(()=>{
      document.getElementById('card').style.visibility = 'visible';
    },300);
  });

  ipcRenderer.on('card-close', (event) => {
    close();
  });

  ipcRenderer.on('card-focused', (event) => {
    document.getElementById('card').style.border = '3px solid red';
    document.getElementById('title').style.visibility = 'visible';
  });
  
  ipcRenderer.on('card-blured', (event) => {
    if(document.getElementById('contents').style.visibility == 'hidden'){
      endEditMode();
    }
    document.getElementById('card').style.border = '3px solid transparent';
    if(currentBgOpacity == 0){
      document.getElementById('title').style.visibility = 'hidden';
    }
  });

};


/**
 * Initialize
 */
const init = () => {
  createContextMenu();
  initializeUIEvents();
};

const onloaded = () => {
  window.removeEventListener('load', onloaded, false);
  // Resize event must be called after CSS is rendered.
  window.addEventListener('resize', () => {
    resizeWindow();
  });
  // Card must be loaded after CSS is rendered. 
  initializeIPCEvents();
}

if ( document.readyState === 'complete' ) {
  init();
} else {
  const domLoaded = () => {
    document.removeEventListener( 'DOMContentLoaded', domLoaded, false );
    init();
  };
  document.addEventListener( 'DOMContentLoaded', domLoaded, false );
}

window.addEventListener('load', onloaded, false);