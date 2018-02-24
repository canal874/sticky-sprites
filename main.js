"use strict";

const {app, BrowserWindow} = require("electron");
const url = require("url");
const path = require("path");

// Keep a global reference of the window object, if you don"t, the window will
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
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }))

  //----------------------
  // Initialize a sprite
  //----------------------
  sprite.once("ready-to-show", () => {
    // ready-to-show is emitted after $(document).ready
    spritesDB.get(spriteId)
      .then( (doc) => {
        let data = doc != null ? doc.data : "";
        console.log("Load sprite: " + data);
        sprite.webContents.send("sprite-loaded", spriteId, data);
        sprite.show();
      })
      .catch( (err) => {
        console.log("Load sprite error: " + err);
        sprite.webContents.send("sprite-loaded", spriteId, "");
        sprite.show();
      })

  });
//  sprite.openDevTools();
  
  sprites[spriteId] = sprite;
  sprite.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    sprites[spriteId] = null;
    delete sprites[spriteId];
  });
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
var PouchDB = require("pouchdb");
var spritesDB = new PouchDB("sprites");
var confDB = new PouchDB("conf");

var spriteIndex = 0;

// Load config
confDB.get("sprite")
    .then((doc) => {
      spriteIndex = doc.index;
      console.log("spriteIndex: " + spriteIndex);
    })
    .catch((err) => {
       // create default config
       confDB.put({ _id: "sprite", index: 0 })
           .then((res) => {
              console.log("Initial conf created: " + res);
           })
           .catch((err) => {
              console.log("Initial conf creation error: " + err);
           });
    });

// Save sprite
exports.saveToCloseSprite = (spriteId, data) => {
  spritesDB.get(spriteId)
    .then((doc) => {
      doc.data = data;
      spritesDB.put(doc)
        .then((res) => {
          console.log("Sprite saved: " + res.id);
          sprites[spriteId].webContents.send("sprite-saved-to-close");
        })
        .catch((err) => {
          console.log("Sprite save error: " + err);
        });
    })
    .catch((err) => {
      // create new sprite
      spritesDB.put({ _id: spriteId, data: data })
          .then((res) => {
              console.log("New sprite saved: " + res.id);
              sprites[spriteId].webContents.send("sprite-saved-to-close");
           })
           .catch((err) => {
              console.log("New sprite save error: " + err);
           });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  var spriteId = "spr0"
  createSprite(spriteId);
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}
