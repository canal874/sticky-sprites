/** 
 * @license
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

"use strict";

const {app, BrowserWindow} = require("electron");
const i18n = require("i18n");
const url = require("url");
const path = require("path");


var mylog = require('electron-log');

i18n.configure({
  // Locales under the directory are automatically detected.
  // Other locales default to en silently.
  directory: __dirname + '/locales'
});
exports.i18n = (msg) => {
  return i18n.__(msg);
}


process.on('uncaughtException', function(err) {
  mylog.error('electron:event:uncaughtException');
  mylog.error(err);
  mylog.error(err.stack);
  app.quit();
});

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
const cards = {};

// A small sticky windows is called "card".
const defaultCardWidth = 260;
const defaultCardHeight = 176;
const defaultCardX = 70;
const defaultCardY = 70;
let defaultCardColor = "#ffffa0";
let defaultBgOpacity = 1.0;

let buildCard = function (cardId) {
  let card = new BrowserWindow({
	  webPreferences: {
      nodeIntegration: true
    },
    width: defaultCardWidth,
    height: defaultCardHeight,
    x: defaultCardX + Math.round( Math.random()*50),
    y: defaultCardY + Math.round( Math.random()*50),
    transparent: true,
    frame: false,
    show: false,
    "always-on-top": true,
    "title-bar-style": "hidden-inset"
  });

  card.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }))

  //----------------------
  // Initialize a card
  //----------------------
  card.once("ready-to-show", () => {
    // ready-to-show is emitted after $(document).ready
    let data,x,y,w,h,color,bgOpacity;
    cardsDB.get(cardId)
      .then((doc) => {
        data = doc != null ? (doc.data !== undefined ? doc.data : "") : "";
        w = doc != null ? (doc.width !== undefined ? doc.width : defaultCardWidth) : defaultCardWidth;
        h = doc != null ? (doc.height !== undefined ? doc.height : defaultCardHeight) : defaultCardHeight;
        x = doc != null ? (doc.x !== undefined ? doc.x : defaultCardX) : defaultCardX;
        y = doc != null ? (doc.y !== undefined ? doc.y : defaultCardY) : defaultCardY;
        color = doc != null ? (doc.color !== undefined ? doc.color : defaultCardColor) : defaultCardColor;
        bgOpacity = doc != null ? (doc.bgOpacity !== undefined ? doc.bgOpacity : defaultBgOpacity) : defaultBgOpacity;
      })
      .catch((err) => {
        console.log("Load card error: " + cardId + ", " + err);
        data = "";
        w = defaultCardWidth;
        h = defaultCardHeight;
        x = defaultCardX;
        y = defaultCardY;
        color = defaultCardColor;
        bgOpacity = defaultBgOpacity;
      })
      .then(() => {
        // save prev values
        card.prevData = data;
        card.prevX = x;
        card.prevY = y;
        card.prevW = w;
        card.prevH = h;
        card.prevColor = color;
        card.prevBgOpacity = bgOpacity;
        card.webContents.send("card-loaded", cardId, data, x, y, w, h, color, bgOpacity);
        card.setSize(w, h);
        card.setPosition(x, y);
        card.show();
        card.blur();        
      });

  });
  
  cards[cardId] = card;
  card.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    cards[cardId] = null;
    delete cards[cardId];
  });

  card.on("focus", () => {
    card.webContents.send("card-focused");
  });
  card.on("blur", () => {
    card.webContents.send("card-blured");
  });

//    card.openDevTools();
}

app.on("window-all-closed", () => {
  if (process.platform != "darwin"){
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
  if(data == ""){
    let spr = cards[cardId];
    cardsDB.get(cardId)
      .then((doc) => {
        cardsDB.remove(doc);
        spr.webContents.send("card-close");
      })
      .catch((err) => {
        spr.webContents.send("card-close");
      });
  }
  else{
    saveCard(cardId, data, color, bgOpacity, true);
  }
};

let saveCard = (cardId, data, color, bgOpacity, closeAfterSave) => {
  let spr = cards[cardId];
  let pos = spr.getPosition();
  let size = spr.getSize();
  let x = pos[0];
  let y = pos[1];
  let w = size[0];
  let h = size[1];
  
  if(x == spr.prevX
    && y == spr.prevY
    && w == spr.prevW
    && h == spr.prevH
    && data == spr.prevData
    && color == spr.prevColor
    && color == spr.prevBgOpacity
  ){
    if(closeAfterSave){
      spr.webContents.send("card-close");
    }
    return;
  }
  let newDoc;
  cardsDB.get(cardId)
    .then((doc) => {
      newDoc = doc;
    })
    .catch((err) => {
      // create new card
      newDoc = { _id: cardId, data: data, width: w, height: h, x: x, y: y, color: color, bgOpacity: bgOpacity };
    })
    .then(() => {
      newDoc.data = spr.prevData = data;
      newDoc.x = spr.prevX = x;
      newDoc.y = spr.prevY = y;
      newDoc.width = spr.prevW = w;
      newDoc.height = spr.prevH = h;
      newDoc.color = spr.prevColor = color;
      newDoc.bgOpacity = spr.prevBgOpacity = bgOpacity;
      console.log("Saving card...: " + newDoc._id + ",x:" + x + ",y:" + y + ",w:" + w + ",h:" + h + "color:" + color + ",bgOpacity:" + bgOpacity + ",data:" + data);
      cardsDB.put(newDoc)
        .then((res) => {
          if(closeAfterSave){
            spr.webContents.send("card-close");
          }
        })
        .catch((err) => {
          console.log("Card save error: " + err);
        });
    });
}

// Create new card
exports.createCard = () => {
  cardIndex++;
  let cardId = "spr" + cardIndex;
  buildCard(cardId);

  confDB.get("card")
    .then((doc) => {
      doc.index = cardIndex;
      confDB.put(doc)
           .catch((err) => {
              console.log("conf update error: " + err);
           });
    })
    .catch((err) => {
      console.log("conf read error: " + err);
    });

};


var PouchDB = require("pouchdb");
var cardsDB = null;
var confDB = null;
var cardIndex = 0;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // locale can be got after "ready"
  console.log("locale: " + app.getLocale());
  i18n.setLocale(app.getLocale());

  confDB = new PouchDB("conf");
  cardsDB = new PouchDB("cards");

  // Load config
  confDB.get("card")
    .then((doc) => {
      cardIndex = doc.index;
      console.log("cardIndex: " + cardIndex);
    })
    .catch((err) => {
       // create default config
       confDB.put({ _id: "card", index: 0 })
           .then((res) => {
              console.log("Initial conf created: " + res);
           })
           .catch((err) => {
              console.log("Initial conf creation error: " + err);
           });
    });

  // load cards
  let docs = null;
  cardsDB.allDocs()
    .then((res) => {
      if(res.rows.length == 0){
        // Create a new card
        let cardId = "spr" + cardIndex;
        buildCard(cardId);
      }
      else{
        for (let doc of res.rows){
          let cardId = doc.id;
          buildCard(cardId);
        }
      }
    })
    .catch((err) => {
      console.log("cards load error: " + err);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}
