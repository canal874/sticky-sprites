"use strict";

const {app, BrowserWindow} = require("electron");
const url = require("url");
const path = require("path");

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
const sprites = {};

// A small sticky windows is called "sprite".
const defaultSpriteWidth = 260;
const defaultSpriteHeight = 176;
const defaultSpriteX = 70;
const defaultSpriteY = 70;

let buildSprite = function (spriteId) {
  let sprite = new BrowserWindow({
    width: defaultSpriteWidth,
    height: defaultSpriteHeight,
    x: defaultSpriteX,
    y:defaultSpriteY,
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
    let data,x,y,w,h;
    spritesDB.get(spriteId)
      .then((doc) => {
        data = doc != null ? doc.data : "";
        w = doc != null ? doc.width : defaultSpriteWidth;
        h = doc != null ? doc.height : defaultSpriteHeight;
        x = doc != null ? doc.x : defaultSpriteX;
        y = doc != null ? doc.y : defaultSpriteY;

      })
      .catch((err) => {
        console.log("Load sprite error: " + spriteId + ", " + err);
        data = "";
        w = defaultSpriteWidth;
        h = defaultSpriteHeight;
        x = defaultSpriteX;
        y = defaultSpriteY;
      })
      .then(() => {
        // save prev values
        sprite.prevData = data;
        sprite.prevX = x;
        sprite.prevY = y;
        sprite.prevW = w;
        sprite.prevH = h;

        sprite.webContents.send("sprite-loaded", spriteId, data, x, y, w, h);
        sprite.setSize(w, h);
        sprite.setPosition(x, y);
        sprite.show();
      });

  });
  
  sprites[spriteId] = sprite;
  sprite.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    sprites[spriteId] = null;
    delete sprites[spriteId];
  });

  sprite.on("focus", () => {
    sprite.webContents.send("sprite-focused");
  });
  sprite.on("blur", () => {
    sprite.webContents.send("sprite-blured");
  });

  //  sprite.openDevTools();
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
exports.saveSprite = (spriteId, data) => {
  saveSprite(spriteId, data, false);
};
exports.saveToCloseSprite = (spriteId, data) => {  
  saveSprite(spriteId, data, true);
};

let saveSprite = (spriteId, data, closeAfterSave) => {
  let spr = sprites[spriteId];
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
  ){
    if(closeAfterSave){
      spr.webContents.send("sprite-close");
    }
    return;
  }
  let newDoc;
  spritesDB.get(spriteId)
    .then((doc) => {
      newDoc = doc;
    })
    .catch((err) => {
      // create new sprite
      newDoc = { _id: spriteId, data: data, width: w, height: h, x: x, y: y };
    })
    .then(() => {
      newDoc.data = spr.prevData = data;
      newDoc.x = spr.prevX = x;
      newDoc.y = spr.prevY = y;
      newDoc.width = spr.prevW = w;
      newDoc.height = spr.prevH = h;
      console.log("Saving sprite...: " + newDoc._id + ",x:" + x + ",y:" + y + ",w:" + w + ",h:" + h + ",data:" + data);
      spritesDB.put(newDoc)
        .then((res) => {
          if(closeAfterSave){
            spr.webContents.send("sprite-close");
          }
        })
        .catch((err) => {
          console.log("Sprite save error: " + err);
        });
    });
}

// Create new sprite
exports.createSprite = () => {
  spriteIndex++;
  let spriteId = "spr" + spriteIndex;
  buildSprite(spriteId);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // load sprites
  let docs = null;
  spritesDB.allDocs()
    .then((res) => {
      for (let doc of res.rows){
        let spriteId = doc.id;
        buildSprite(spriteId);
      }
    })
    .catch((err) => {
      console.log("load sprites: " + err);
      // Create a new sprite
      let spriteId = "spr" + spriteIndex;
      buildSprite(spriteId);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}
