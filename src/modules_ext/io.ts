/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Common part
 */
import uniqid from 'uniqid';
import { CardProp, CardPropSerializable } from '../modules_common/cardprop';
import { ICardIO } from '../modules_common/types';
import { logger } from '../modules_common/utils';

let cardDir = './cards';
if (process.env.NODE_CARDDIR) {
  cardDir = process.env.NODE_CARDDIR;
}

/**
 * Module specific part
 */

import pouchDB from 'pouchdb';
var cardsDB: PouchDB.Database<{}>;

class CardIOClass implements ICardIO {
  public generateNewCardId = (): string => {
    // returns 18 byte unique characters
    return uniqid();
  };

  public getCardIdList = (): Promise<Array<string>> => {
    // returns all card ids.
    cardsDB = new pouchDB(cardDir);
    return new Promise((resolve, reject) => {
      cardsDB
        .allDocs()
        .then(res => {
          resolve(res.rows.map(row => row.id));
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  public deleteCardData = (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      cardsDB
        .get(id)
        .then(res => {
          cardsDB.remove(res);
          resolve(id);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  public readCardData = (id: string): Promise<CardProp> => {
    return new Promise((resolve, reject) => {
      cardsDB
        .get(id)
        .then(doc => {
          const propsRequired: CardPropSerializable = new CardProp(
            ''
          ).toObject();
          // Checking properties retrieved from database
          for (let key in propsRequired) {
            if (key == 'id') {
              // skip
              // pouchDB does not have id but has _id.
            }
            // Don't use doc.hasOwnProperty(key)
            // See eslint no-prototype-builtins
            else if (!Object.prototype.hasOwnProperty.call(doc, key)) {
              logger.warn(`db entry id "${id}" lacks "${key}"`);
            }
            else {
              // Type of doc cannot be resolved by @types/pouchdb-core
              // @ts-ignore
              propsRequired[key] = doc[key];
            }
          }

          resolve(
            new CardProp(
              id,
              propsRequired.data,
              {
                x: propsRequired.x,
                y: propsRequired.y,
                width: propsRequired.width,
                height: propsRequired.height,
              },
              {
                titleColor: propsRequired.titleColor,
                backgroundColor: propsRequired.backgroundColor,
                backgroundOpacity: propsRequired.backgroundOpacity,
              },
              {
                createdDate: propsRequired.createdDate,
                modifiedDate: propsRequired.modifiedDate,
              }
            )
          );
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  public writeOrCreateCardData = (prop: CardProp): Promise<string> => {
    return new Promise((resolve, reject) => {
      logger.debug('Saving card...: ' + JSON.stringify(prop.toObject()));

      // In PouchDB, _id must be used instead of id in document.
      // Convert class to Object to serialize.
      let propObj = Object.assign({ _id: prop.id, _rev: '' }, prop.toObject());

      delete propObj.id;

      cardsDB
        .get(prop.id)
        .then(oldCard => {
          // Update existing card
          propObj._rev = oldCard._rev;
        })
        .catch(() => {
          /* Create new card */
        })
        .then(() => {
          cardsDB
            .put(propObj)
            .then(res => {
              resolve(res.id);
            })
            .catch(err => {
              throw err;
            });
        })
        .catch(err => {
          reject(err);
        });
    });
  };
}

// Singleton.
// Must export const CardIO.
// CardIO is an instance of a class that implements ICardIO interface.
export const CardIO = new CardIOClass();
