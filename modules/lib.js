/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

const pouchDB = require('pouchdb');
const uniqid = require('uniqid');

var cardsDB = null;

let cardDir = './cards';
if(process.env.NODE_CARDDIR){
  cardDir = process.env.NODE_CARDDIR;
}

module.exports.generateNewCardId = () => {
  // returns 18 byte unique characters
  return uniqid();
};

module.exports.getCardsList = () => {
  cardsDB = new pouchDB(cardDir);
  return new Promise((resolve, reject) => {
    cardsDB.allDocs()
      .then((res) => {
        resolve(res.rows);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.deleteCardDataAsync = (cardId) => {
  return new Promise((resolve, reject) => {
    cardsDB.get(cardId)
      .then((res) => {
        cardsDB.remove(res);
        resolve(cardId);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.readCardDataAsync = (cardId) => {
  return new Promise((resolve, reject) => {
    cardsDB.get(cardId)
      .then((card) => {
        resolve(card);
      })
      .catch((err) => {
        reject(err);
      })
  });
}

module.exports.writeOrCreateCardDataAsync = (newCard) => {
  return new Promise((resolve, reject) => {
    console.log('Saving card...: ' + newCard.id + ',x:' + newCard.x + ',y:' + newCard.y + ',w:' + newCard.width + ',h:' + newCard.height + 'color:' + newCard.color + ',bgOpacity:' + newCard.bgOpacity + ',data:' + newCard.data);

    // In PouchDB, _id must be used insted of id
    newCard._id = newCard.id;
    delete newCard.id;

    cardsDB.get(newCard._id)
      .then((oldCard) => {
        // Update existing card
        newCard._rev = oldCard._rev;
      })
      .catch((err) => {
        // Create new card
      })
      .then(() => {
        cardsDB.put(newCard)
          .then((res) => {
            resolve(res.id);
          })
          .catch((err) => {
            reject('Card save error: ' + err);
          });
      });
  });
};