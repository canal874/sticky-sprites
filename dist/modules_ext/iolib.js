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
/**
 * Common part
 */
const types_1 = require("../modules_common/types");
const uniqid_1 = __importDefault(require("uniqid"));
let cardDir = './cards';
if (process.env.NODE_CARDDIR) {
    cardDir = process.env.NODE_CARDDIR;
}
/**
 * Module specific part
 */
const pouchdb_1 = __importDefault(require("pouchdb"));
var cardsDB = null;
class CardInputOutputClass {
    constructor() {
        this.generateNewCardId = () => {
            // returns 18 byte unique characters
            return uniqid_1.default();
        };
        this.getCardIdList = () => {
            // returns all card ids.
            cardsDB = new pouchdb_1.default(cardDir);
            return new Promise((resolve, reject) => {
                cardsDB.allDocs()
                    .then((res) => {
                    resolve(res.rows.map((row) => row.id));
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        };
        this.deleteCardData = (id) => {
            return new Promise((resolve, reject) => {
                cardsDB.get(id)
                    .then((res) => {
                    cardsDB.remove(res);
                    resolve(id);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        };
        this.readCardData = (id) => {
            return new Promise((resolve, reject) => {
                cardsDB.get(id)
                    .then((doc) => {
                    // type of doc cannot be resolved by @types/pouchdb-core
                    // @ts-ignore
                    resolve(new types_1.CardProp(id, doc.data, doc.x, doc.y, doc.width, doc.height, doc.bgColor, doc.bgOpacity));
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        };
        this.writeOrCreateCardData = (prop) => {
            return new Promise((resolve, reject) => {
                console.log('Saving card...: ' + prop.id + ',x:' + prop.x + ',y:' + prop.y + ',w:' + prop.width + ',h:' + prop.height + 'color:' + prop.bgColor + ',bgOpacity:' + prop.bgOpacity + ',data:' + prop.data);
                // In PouchDB, _id must be used insted of id in document.
                // Convert class to Object to serialize.
                let propObj = Object.assign({ _id: prop.id, _rev: '' }, prop);
                delete propObj.id;
                cardsDB.get(prop.id)
                    .then((oldCard) => {
                    // Update existing card
                    propObj._rev = oldCard._rev;
                })
                    .catch((err) => {
                    // Create new card
                })
                    .then(() => {
                    cardsDB.put(propObj)
                        .then((res) => {
                        resolve(res.id);
                    })
                        .catch((err) => {
                        reject('Card save error: ' + err);
                    });
                });
            });
        };
    }
}
// Must export const CardIO.
// CardIO is an instance of a class that implements CardInputOutput intercface.
exports.CardIO = new CardInputOutputClass();
//# sourceMappingURL=iolib.js.map