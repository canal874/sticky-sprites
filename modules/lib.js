/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

const pouchDB = require('pouchdb');

var cardsDB = null;
var confDB = null;
var cardIndex = 0;

let cardDir = './cards';
if(process.env.NODE_CARDDIR){
  cardDir = process.env.NODE_CARDDIR;
}

module.exports.generateNewCardId = () => {
  cardIndex++;
  return 'card' + cardIndex;
};

module.exports.getCardsList = () => {
  confDB = new pouchDB('conf');
  cardsDB = new pouchDB(cardDir);

  // Load config
  confDB.get('card')
    .then((doc) => {
      cardIndex = doc.index;
      console.log('cardIndex: ' + cardIndex);
    })
    .catch((err) => {
      // create default config
      confDB.put({ _id: 'card', index: 0 })
        .then((res) => {
          console.log('Initial conf created: ' + res);
        })
        .catch((err) => {
          console.log('Initial conf creation error: ' + err);
        });
    });

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

        confDB.get('card')
          .then((doc) => {
            doc.index = cardIndex;
            confDB.put(doc)
              .catch((err) => {
                console.log('conf update error: ' + err);
              });
          })
          .catch((err) => {
            console.log('conf read error: ' + err);
          });

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