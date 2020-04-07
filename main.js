"use strict";

const {app, BrowserWindow} = require("electron");
const url = require("url");
const path = require("path");


var mylog = require('electron-log');

process.on('uncaughtException', function(err) {
  mylog.error('electron:event:uncaughtException');
  mylog.error(err);
  mylog.error(err.stack);
  app.quit();
});

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
const sprites = {};

// A small sticky windows is called "sprite".
const defaultSpriteWidth = 260;
const defaultSpriteHeight = 176;
const defaultSpriteX = 70;
const defaultSpriteY = 70;
let defaultSpriteColor = "#ffffa0";
let defaultBgOpacity = 1.0;

let buildSprite = function (spriteId) {
  let sprite = new BrowserWindow({
	webPreferences: {
      nodeIntegration: true
    },
    width: defaultSpriteWidth,
    height: defaultSpriteHeight,
    x: defaultSpriteX + Math.round( Math.random()*50),
    y: defaultSpriteY + Math.round( Math.random()*50),
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
    let data,x,y,w,h,color,bgOpacity;
    spritesDB.get(spriteId)
      .then((doc) => {
        data = doc != null ? (doc.data !== undefined ? doc.data : "") : "";
        w = doc != null ? (doc.width !== undefined ? doc.width : defaultSpriteWidth) : defaultSpriteWidth;
        h = doc != null ? (doc.height !== undefined ? doc.height : defaultSpriteHeight) : defaultSpriteHeight;
        x = doc != null ? (doc.x !== undefined ? doc.x : defaultSpriteX) : defaultSpriteX;
        y = doc != null ? (doc.y !== undefined ? doc.y : defaultSpriteY) : defaultSpriteY;
        color = doc != null ? (doc.color !== undefined ? doc.color : defaultSpriteColor) : defaultSpriteColor;
        bgOpacity = doc != null ? (doc.bgOpacity !== undefined ? doc.bgOpacity : defaultBgOpacity) : defaultBgOpacity;
      })
      .catch((err) => {
        console.log("Load sprite error: " + spriteId + ", " + err);
        data = "";
        w = defaultSpriteWidth;
        h = defaultSpriteHeight;
        x = defaultSpriteX;
        y = defaultSpriteY;
        color = defaultSpriteColor;
        bgOpacity = defaultBgOpacity;
      })
      .then(() => {
        // save prev values
        sprite.prevData = data;
        sprite.prevX = x;
        sprite.prevY = y;
        sprite.prevW = w;
        sprite.prevH = h;
        sprite.prevColor = color;
        sprite.prevBgOpacity = bgOpacity;
        sprite.webContents.send("sprite-loaded", spriteId, data, x, y, w, h, color, bgOpacity);
        sprite.setSize(w, h);
        sprite.setPosition(x, y);
        sprite.show();
        sprite.blur();        
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

//    sprite.openDevTools();
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

// Save sprite
exports.saveSprite = (spriteId, data, color, bgOpacity) => {
  saveSprite(spriteId, data, color, bgOpacity, false);
};
exports.saveToCloseSprite = (spriteId, data, color, bgOpacity) => {
  if(data == ""){
    let spr = sprites[spriteId];
    spritesDB.get(spriteId)
      .then((doc) => {
        spritesDB.remove(doc);
        spr.webContents.send("sprite-close");
      })
      .catch((err) => {
        spr.webContents.send("sprite-close");
      });
  }
  else{
    saveSprite(spriteId, data, color, bgOpacity, true);
  }
};

let saveSprite = (spriteId, data, color, bgOpacity, closeAfterSave) => {
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
    && color == spr.prevColor
    && color == spr.prevBgOpacity
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
      newDoc = { _id: spriteId, data: data, width: w, height: h, x: x, y: y, color: color, bgOpacity: bgOpacity };
    })
    .then(() => {
      newDoc.data = spr.prevData = data;
      newDoc.x = spr.prevX = x;
      newDoc.y = spr.prevY = y;
      newDoc.width = spr.prevW = w;
      newDoc.height = spr.prevH = h;
      newDoc.color = spr.prevColor = color;
      newDoc.bgOpacity = spr.prevBgOpacity = bgOpacity;
      console.log("Saving sprite...: " + newDoc._id + ",x:" + x + ",y:" + y + ",w:" + w + ",h:" + h + "color:" + color + ",bgOpacity:" + bgOpacity + ",data:" + data);
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

  confDB.get("sprite")
    .then((doc) => {
      doc.index = spriteIndex;
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
var spritesDB = null;
var confDB = null;
var spriteIndex = 0;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  confDB = new PouchDB("conf");
  spritesDB = new PouchDB("sprites");

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

  // load sprites
  let docs = null;
  spritesDB.allDocs()
    .then((res) => {
      if(res.rows.length == 0){
        // Create a new sprite
        let spriteId = "spr" + spriteIndex;
        buildSprite(spriteId);
      }
      else{
        for (let doc of res.rows){
          let spriteId = doc.id;
          buildSprite(spriteId);
        }
      }
    })
    .catch((err) => {
      console.log("sprites load error: " + err);
    });
});

//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
  console.log(txt);
}
