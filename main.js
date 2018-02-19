'use strict';

const {app, BrowserWindow} = require("electron");
const url = require("url");
const path = require("path");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const sprites = {};

// A small sticky windows is called "sprite".
let createSprite = function (spriteId) {
  let sprite = new BrowserWindow({
    width: 240,
    height: 176,
    transparent: true,
    frame: false,
    show: false,
    "always-on-top": true,
    "title-bar-style": "hidden-inset"
  });

  sprite.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //----------------------
  // Initialize a sprite
  //----------------------
  sprite.once('ready-to-show', () => {
    // ready-to-show is emitted after $(document).ready
    db.findOne({ key:spriteId }, (err, doc) => {
      let cdata = doc != null ? doc.cdata : "";
      sprite.webContents.send('sprite-loaded', spriteId, cdata);
      sprite.show();
    });
  });
//  sprite.openDevTools();
  
  sprites[spriteId] = sprite;
  sprite.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    sprites[spriteId] = null;
    delete sprites[spriteId];
  });
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
var Datastore = require('nedb');
var db = new Datastore({
  filename: 'sprites.db',
  autoload: true
});

exports.saveToCloseSprite = (spriteId, json) => {
  db.update({ key:spriteId }, json, { upsert:true }, () => {
    sprites[spriteId].webContents.send('sprite-saved-to-close');
  });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createSprite("0");
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}
