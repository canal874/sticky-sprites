/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const typed_intl_1 = require("typed-intl");
const url_1 = __importDefault(require("url"));
const path_1 = __importDefault(require("path"));
const base_msg_1 = __importDefault(require("./modules_common/base.msg"));
const types_1 = require("./modules_common/types");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    electron_1.app.quit();
}
/**
 * Filepath
 */
let extraModulePath = './modules_ext';
if (process.env.NODE_LIBPATH) {
    extraModulePath = process.env.NODE_EXTRA_MODULE_PATH;
}
// variable cannot be placed after import from.
// import { CardIO } from extraModulePath + '/iolib.js';
const { CardIO } = require(`${extraModulePath}/iolib`);
/**
 * i18n
 */
typed_intl_1.selectPreferredLanguage(['en', 'ja']);
exports.MESSAGE = base_msg_1.default.messages();
/**
 * Const
 */
const minimumWindowWidth = 30;
/**
 * Card
 * A small sticky windows is called 'card'.
 */
const cards = new Map();
class Card {
    constructor(id) {
        this.id = id;
        if (!id) {
            return;
        }
        this.window = new electron_1.BrowserWindow({
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
            electron_1.shell.openExternal(url);
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
        this.window.loadURL(url_1.default.format({
            pathname: path_1.default.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
}
//----------------------
// Initialize a cardWindow
//----------------------
electron_1.ipcMain.on('dom-loaded', (event, id) => {
    console.log('dom-loaded: ' + id);
    const win = cards.get(id).window;
    let prop = null;
    CardIO.readCardData(id)
        .then((_prop) => {
        prop = _prop;
    })
        .catch((err) => {
        console.log('Load card error: ' + id + ', ' + err);
        prop = new types_1.CardProp(id);
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
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
//-----------------------------------
// Serialization
//-----------------------------------
// Save card
exports.saveToCloseCard = (prop) => {
    if (prop.data == '') {
        CardIO.deleteCardData(prop.id)
            .catch((err) => {
            console.log(err);
        })
            .then(() => {
            console.log('closing :' + prop.id);
            cards.get(prop.id).window.webContents.send('card-close');
        });
    }
    else {
        exports.saveCard(prop, true);
    }
};
exports.saveCard = (prop, closeAfterSave = false) => {
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
        .catch((err) => {
        console.log(err);
    });
};
// Create new card
exports.createCard = () => {
    const id = CardIO.generateNewCardId();
    cards.set(id, new Card(id));
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', () => {
    // locale can be got after 'ready'
    // load cards
    CardIO.getCardIdList()
        .then((arr) => {
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
        .catch((err) => {
        console.log('cards load error: ' + err);
    });
});
//-----------------------------------
// Utils
//-----------------------------------
exports.log = (txt) => {
    console.log(txt);
};
exports.getMinimumWindowWidth = () => {
    return minimumWindowWidth;
};
exports.setCardHeight = (id, height) => {
    const card = cards.get(id);
    const size = card.window.getSize();
    const w = size[0];
    card.window.setSize(w, height);
};
exports.getCardHeight = (id) => {
    const card = cards.get(id);
    const size = card.window.getSize();
    return size[1];
};
//# sourceMappingURL=main.js.map