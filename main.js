/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

const { app, shell, BrowserWindow } = require('electron');
const i18n = require('i18n');
const url = require('url');
const path = require('path');
const util = require('util');

/**
 * Filepath
 */
let libPath = './modules';
if(process.env.NODE_LIBPATH){
  libPath = process.env.NODE_LIBPATH;
}

const { generateNewCardId, getCardsList, readCardDataAsync, writeOrCreateCardDataAsync, deleteCardDataAsync} = require(libPath + '/lib.js');


 /**
  * Logging
  */
var mylog = require('electron-log');

/**
 * Error handling
 */
process.on('uncaughtException', function(err) {
  mylog.error('electron:event:uncaughtException');
  mylog.error(err);
  mylog.error(err.stack);
  app.quit();
});

/**
 * i18n
 */
i18n.configure({
  // Locales under the directory are automatically detected.
  // Other locales default to en silently.
  directory: __dirname + '/locales'
});
exports.i18n = (msg) => {
  return i18n.__(msg);
}


/**
 * Card
 * A small sticky windows is called 'card'.
 */
const cards = {};

const defaultCardWidth = 260;
const defaultCardHeight = 176;
const defaultCardX = 70;
const defaultCardY = 70;
const minimumWindowWidth = 30;
let defaultCardColor = '#ffffa0';
let defaultBgOpacity = 1.0;

let buildCard = function (cardId) {
  let card = new BrowserWindow({
	  webPreferences: {
      nodeIntegration: true
    },
    width: defaultCardWidth,
    height: defaultCardHeight,
    minWidth : minimumWindowWidth,
    x: defaultCardX + Math.round( Math.random()*50),
    y: defaultCardY + Math.round( Math.random()*50),
    transparent: true,
    frame: false,
    show: false,
    'always-on-top': true,
    'title-bar-style': 'hidden-inset'
  });

  // Open hyperlink on external browser window
  // by preventing to open it on new electron window
  // when target='_blank' is set.
  card.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  card.on('will-resize', (event, newBounds) => {
    card.webContents.send('resize-byhand', newBounds);
  });

  card.on('will-move', (event, newBounds) => {
    card.webContents.send('move-byhand', newBounds);    
  });

  card.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //----------------------
  // Initialize a card
  //----------------------
  card.once('ready-to-show', () => {
    // ready-to-show is emitted after $(document).ready

    let data,x,y,w,h,color,bgOpacity;

    readCardDataAsync(cardId)
      .then((card) => {
        // Check data
        data = card != null ? (card.data !== undefined ? card.data : '') : '';
        w = card != null ? (card.width !== undefined ? card.width : defaultCardWidth) : defaultCardWidth;
        h = card != null ? (card.height !== undefined ? card.height : defaultCardHeight) : defaultCardHeight;
        x = card != null ? (card.x !== undefined ? card.x : defaultCardX) : defaultCardX;
        y = card != null ? (card.y !== undefined ? card.y : defaultCardY) : defaultCardY;
        color = card != null ? (card.color !== undefined ? card.color : defaultCardColor) : defaultCardColor;
        bgOpacity = card != null ? (card.bgOpacity !== undefined ? card.bgOpacity : defaultBgOpacity) : defaultBgOpacity;
      })
      .catch((err) => {
        console.log('Load card error: ' + cardId + ', ' + err);
        data = '';
        w = defaultCardWidth;
        h = defaultCardHeight;
        x = defaultCardX;
        y = defaultCardY;
        color = defaultCardColor;
        bgOpacity = defaultBgOpacity;
      })
      .then(() => {
        card.webContents.send('card-loaded', cardId, data, x, y, w, h, color, bgOpacity);
        card.setSize(w, h);
        card.setPosition(x, y);
        card.show();
        card.blur();
      });

  });
  
  cards[cardId] = card;
  card.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    cards[cardId] = null;
    delete cards[cardId];
  });

  card.on('focus', () => {
    card.webContents.send('card-focused');
  });
  card.on('blur', () => {
    card.webContents.send('card-blured');
  });

//    card.openDevTools();
}

app.on('window-all-closed', () => {
  if (process.platform != 'darwin'){
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit();
  }
});

//-----------------------------------
// Serialization
//-----------------------------------

// Save card
exports.saveCard = (cardId, data, color, bgOpacity) => {
  saveCard(cardId, data, color, bgOpacity, false);
};
exports.saveToCloseCard = (cardId, data, color, bgOpacity) => {
  if(data == ''){
    let card = cards[cardId];
    deleteCardDataAsync(cardId)
      .catch((err) => {
        console.log(err);
      })
      .then((doc) => {
        card.webContents.send('card-close');
      })
  }
  else{
    saveCard(cardId, data, color, bgOpacity, true);
  }
};




const saveCard = (cardId, data, color, bgOpacity, closeAfterSave) => {
  const card = cards[cardId];
  const pos = card.getPosition();
  const size = card.getSize();

  const newCard = {
    id: cardId,
    x: pos[0],
    y: pos[1],
    width: size[0],
    height: size[1],
    color: color,
    bgOpacity: bgOpacity,
    data: data
  };
  
  writeOrCreateCardDataAsync(newCard)
  .then((res) => {
    if (closeAfterSave) {
      card.webContents.send('card-close');
    }
  })
  .catch((err) => {
    console.log(err);
  });
}

// Create new card
exports.createCard = () => {
  buildCard(generateNewCardId());
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // locale can be got after 'ready'
  console.log('locale: ' + app.getLocale());
  i18n.setLocale(app.getLocale());

  // load cards
  getCardsList()
    .then((arr) => {
      if (arr.length == 0) {
        // Create a new card
        buildCard(generateNewCardId());
      }
      else {
        for (let doc of arr) {
          let cardId = doc.id;
          buildCard(cardId);
        }
      }
    })
    .catch((err) => {
      console.log('cards load error: ' + err);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}

exports.getMinimumWindowWidth = () => {
  return minimumWindowWidth;
}

exports.setCardHeight = (cardId, height) => {
  const card = cards[cardId];  
  const size = card.getSize();
  const w = size[0];
  card.setSize(w, height);
}

exports.getCardHeight = (cardId) => {
  const card = cards[cardId];  
  const size = card.getSize();
  return size[1];
}



