/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Common part
 */

import { CardProp, CardPropSerializable, ICardIO } from '../modules_common/types';
import uniqid from 'uniqid';

let cardDir = './cards';
if(process.env.NODE_CARDDIR){
  cardDir = process.env.NODE_CARDDIR;
}

/** 
 * Module specific part 
 */

import pouchDB from 'pouchdb';
var cardsDB: PouchDB.Database<{}> = null;


class CardIOClass implements ICardIO {

  public generateNewCardId = (): string => {
    // returns 18 byte unique characters
    return uniqid();
  };

  public getCardIdList = (): Promise<Array<string>> => {
    // returns all card ids.
    cardsDB = new pouchDB(cardDir);
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

  public deleteCardData = (id: string): Promise<string> => {
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

  public readCardData = (id: string): Promise<CardProp> => {
    return new Promise((resolve, reject) => {
      cardsDB.get(id)
        .then((doc) => {
          const propsRequired: CardPropSerializable = (new CardProp('')).serialize();
          // Checking properties retrieved from database
          for(let key in propsRequired){
            if(!doc.hasOwnProperty(key)){
              console.log(`db entry id "${id}" lacks "${key}"`);
            }
            else{
              // Type of doc cannot be resolved by @types/pouchdb-core
              // @ts-ignore          
              propsRequired[key] = doc[key];
            }
          }

          resolve(new CardProp(id, propsRequired.data, 
            { x: propsRequired.x, y: propsRequired.y, width: propsRequired.width, height: propsRequired.height },
            { titleColor: propsRequired.titleColor, backgroundColor: propsRequired.backgroundColor, backgroundOpacity: propsRequired.backgroundOpacity}));

        })
        .catch((err) => {
          reject(err);
        })
    });
  }

  public writeOrCreateCardData = (prop: CardProp): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('Saving card...: ' + JSON.stringify(prop.serialize()));

      // In PouchDB, _id must be used insted of id in document.
      // Convert class to Object to serialize.
      let propObj = Object.assign({ _id: prop.id, _rev: '' }, prop.serialize());

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

// Singleton.
// Must export const CardIO.
// CardIO is an instance of a class that implements ICardIO intercface.
export const CardIO = new CardIOClass();
