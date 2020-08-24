/* eslint-disable dot-notation */
/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Common part
 */
import { Transform } from 'stream';
import PouchDB from 'pouchdb';
import {
  CardCondition,
  CardDate,
  CardProp,
  CardPropSerializable,
  CardStyle,
  Geometry,
  TransformableFeature,
} from '../modules_common/cardprop';
import { ICardIO } from '../modules_common/types';
import { getSettings } from './store';
import { getCurrentWorkspaceUrl } from './workspace';

/**
 * Module specific part
 */

var cardsDB: PouchDB.Database<{}>;

class CardIOClass implements ICardIO {
  isClosed = true;
  open = () => {
    if (cardsDB === undefined || this.isClosed) {
      cardsDB = new PouchDB(getSettings().persistent.storage.path);
      this.isClosed = false;
    }
  };

  public close = () => {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    if (cardsDB === undefined || cardsDB === null) {
      return Promise.resolve();
    }
    return cardsDB.close();
  };

  public getAvatarIdList = (workspaceId: string): Promise<string[]> => {
    // TODO: load workspaces
    const workspaces = new Map<string, string[]>();
    const avatarIds = workspaces.get(workspaceId);
    if (avatarIds === undefined || avatarIds.length === 0) {
      this.open();
      return new Promise((resolve, reject) => {
        cardsDB
          .allDocs()
          .then(res => {
            resolve(res.rows.map(row => 'reactivedt://local/0/' + row.id));
          })
          .catch(err => {
            reject(err);
          });
      });
    }

    // TODO: load avatars
    return Promise.resolve(['']);
  };

  public getCardIdList = (): Promise<string[]> => {
    // returns all card ids.
    this.open();
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

  public deleteCardData = async (id: string): Promise<string> => {
    // for debug
    // await sleep(60000);
    this.open();
    const card = await cardsDB.get(id);
    await cardsDB.remove(card).catch(e => {
      throw e;
    });
    return id;
  };

  public readCardData = (id: string): Promise<CardProp> => {
    // for debug
    // await sleep(60000);
    this.open();
    return new Promise((resolve, reject) => {
      cardsDB
        .get(id)
        .then(doc => {
          const propsRequired: CardPropSerializable = new CardProp('').toObject();

          // Check versions and compatibility
          if (!Object.prototype.hasOwnProperty.call(doc, 'version')) {
            // The initial version has no version property.
            propsRequired.version = '1.0';

            const { x, y, z, width, height } = (doc as unknown) as Geometry;
            const geometry: Geometry = { x, y, z, width, height };

            const {
              uiColor,
              backgroundColor,
              opacity,
              zoom,
            } = (doc as unknown) as CardStyle;
            const style: CardStyle = { uiColor, backgroundColor, opacity, zoom };

            const condition: CardCondition = {
              locked: false,
            };

            const { createdDate, modifiedDate } = (doc as unknown) as CardDate;
            const date: CardDate = { createdDate, modifiedDate };

            propsRequired.avatars[getCurrentWorkspaceUrl()] = new TransformableFeature(
              geometry,
              style,
              condition,
              date
            );
          }

          // Checking properties retrieved from database
          for (const key in propsRequired) {
            if (key === 'id') {
              // skip
              // pouchDB does not have id but has _id.
            }
            // Don't use doc.hasOwnProperty(key)
            // See eslint no-prototype-builtins
            else if (!Object.prototype.hasOwnProperty.call(doc, key)) {
              console.warn(`db entry id "${id}" lacks "${key}"`);
            }
            else {
              // Type of doc cannot be resolved by @types/pouchdb-core
              // @ts-ignore
              propsRequired[key] = doc[key];
            }
          }

          const prop = new CardProp(id);
          prop.data = propsRequired.data;
          prop.avatars = propsRequired.avatars;

          resolve(prop);
        })
        .catch(e => {
          reject(e);
        });
    });
  };

  public writeOrCreateCardData = async (prop: CardProp): Promise<string> => {
    this.open();
    console.debug('Saving card...: ' + JSON.stringify(prop.toObject()));
    // In PouchDB, _id must be used instead of id in document.
    // Convert class to Object to serialize.
    const propObj = Object.assign({ _id: prop.id, _rev: '' }, prop.toObject());
    delete propObj.id;

    // for debug
    // await sleep(60000);

    await cardsDB
      .get(prop.id)
      .then(oldCard => {
        // Update existing card
        propObj._rev = oldCard._rev;
      })
      .catch(() => {
        /* Create new card */
      });

    return cardsDB
      .put(propObj)
      .then(res => {
        console.debug(`Saved: ${res.id}`);
        return res.id;
      })
      .catch(e => {
        throw e;
      });
  };
}

// Singleton.
// Must export const CardIO.
// CardIO is an instance of a class that implements ICardIO interface.
export const CardIO = new CardIOClass();
