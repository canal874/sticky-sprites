/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { selectPreferredLanguage } from 'typed-intl';
import url from 'url';
import path from 'path'
import translations from './modules_common/base.msg';
import { CardProp } from './modules_common/types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

/**
* i18n
*/
export let MESSAGE: Object = null;

/**
 * Filepath
 */
let extraModulePath = './modules_ext';
if(process.env.NODE_LIBPATH){
  extraModulePath = process.env.NODE_EXTRA_MODULE_PATH;
}
// variable cannot be placed after import from.
// import { CardIO } from extraModulePath + '/iolib.js';
const { CardIO } = require(`${extraModulePath}/iolib`);

/**
 * Const
 */
const minimumWindowWidth = 30;


/**
 * Card
 * A small sticky windows is called 'card'.
 */

const cards:Map<string, Card> = new Map<string, Card>();


class Card {
  public prop: CardProp;
  public window: BrowserWindow;
  constructor(public id: string) {
    if (!id) {
      return;
    }

    this.window = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true
      },
      minWidth: minimumWindowWidth,
      transparent: true,
      frame: false,
      show: false,
      // window title must be card id. This enables some tricks that can access the card window.
      // BrowserWindow.getTitle() can get card id.
      // Other apps can also get card id by getting window title.
      title: id  
    });

    // Open hyperlink on external browser window
    // by preventing to open it on new electron window
    // when target='_blank' is set.
    this.window.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    // Resized by hand
    this.window.on('will-resize', (event, newBounds) => {
      this.window.webContents.send('resize-byhand', newBounds);
    });

    // Moved by hand
    this.window.on('will-move', (event, newBounds) => {
      this.window.webContents.send('move-byhand', newBounds);
    });

    this.window.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      cards.delete(id);
    });

    this.window.on('focus', () => {
      this.window.webContents.send('card-focused');
    });
    this.window.on('blur', () => {
      this.window.webContents.send('card-blured');
    });

    this.window.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))
  }
}

//----------------------
// Initialize a cardWindow
//----------------------
ipcMain.on('dom-loaded', (event, id) => {
  console.log('dom-loaded: ' + id);
  const win = cards.get(id).window;
  let prop: CardProp = null;
  CardIO.readCardData(id)
    .then((_prop: CardProp) => {
      prop = _prop;
    })
    .catch((err: string) => {
      console.log('Load card error: ' + id + ', ' + err);
      prop = new CardProp(id);
    })
    .then(() => {
      setTimeout(() => {
        win.webContents.send('card-loaded', prop);
        win.setSize(prop.width, prop.height);
        win.setPosition(prop.x, prop.y);
        win.show();
        win.blur();
      }, 5000);
    });
});


app.on('window-all-closed', () => {
  app.quit();
});

//-----------------------------------
// Serialization
//-----------------------------------

// Save card
export const saveToCloseCard = (prop:CardProp) => {
  if(prop.data == ''){
    CardIO.deleteCardData(prop.id)
      .catch((err:string) => {
        console.log(err);
      })
      .then(() => {
        console.log('closing :' + prop.id);
        cards.get(prop.id).window.webContents.send('card-close');
      })
  }
  else{
    saveCard(prop, true);
  }
};

export const saveCard = (prop: CardProp, closeAfterSave = false) => {
  const card = cards.get(prop.id);
  const pos = card.window.getPosition();
  const size = card.window.getSize();

  const newCard = {
    id: prop.id,
    x: pos[0],
    y: pos[1],
    width: size[0],
    height: size[1],
    color: prop.bgColor,
    bgOpacity: prop.bgOpacity,
    data: prop.data
  };
  
  CardIO.writeOrCreateCardData(newCard)
  .then(() => {
    if (closeAfterSave) {
      card.window.webContents.send('card-close');
    }
  })
  .catch((err: string) => {
    console.log(err);
  });
}

// Create new card
export const createCard = () => {
  const id = CardIO.generateNewCardId();
  cards.set(id, new Card(id));
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // locale can be got after 'ready'
  console.log('locale: ' + app.getLocale());
  selectPreferredLanguage(['en'], [app.getLocale(), 'en']);
  MESSAGE = translations.messages();

  // load cards
  CardIO.getCardIdList()
    .then((arr:Array<string>) => {
      if (arr.length == 0) {
        // Create a new card
        const id = CardIO.generateNewCardId();
        cards.set(id, new Card(id));
      }
      else {
        for (let id of arr) {
          cards.set(id, new Card(id));
        }
      }
    })
    .catch((err:string) => {
      console.log('cards load error: ' + err);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
export const log = (txt: string) => {
  console.log(txt);
}

export const getMinimumWindowWidth = () => {
  return minimumWindowWidth;
}

export const setCardHeight = (id: string, height: number) => {
  const card = cards.get(id);  
  const size = card.window.getSize();
  const w = size[0];
  card.window.setSize(w, height);
}

export const getCardHeight = (id: string) => {
  const card = cards.get(id);  
  const size = card.window.getSize();
  return size[1];
}
