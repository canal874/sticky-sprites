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
import { getSettings, MESSAGE } from './store';
import { getCurrentWorkspaceUrl, Workspace, workspaces } from './workspace';

/**
 * Module specific part
 */

var cardDB: PouchDB.Database<{}>;
var workspaceDB: PouchDB.Database<{}>;

class CardIOClass implements ICardIO {
  isCardDBClosed = true;
  isWorkspaceDBClosed = true;

  openCardDB = () => {
    if (cardDB === undefined || this.isCardDBClosed) {
      cardDB = new PouchDB(getSettings().persistent.storage.path + '/card');
      this.isCardDBClosed = false;
    }
  };

  openWorkspaceDB = () => {
    if (workspaceDB === undefined || this.isWorkspaceDBClosed) {
      workspaceDB = new PouchDB(getSettings().persistent.storage.path + '/workspace');
      this.isWorkspaceDBClosed = false;
    }
  };

  public close = () => {
    if (!this.isCardDBClosed) {
      this.isCardDBClosed = true;
      if (cardDB === undefined || cardDB === null) {
        return Promise.resolve();
      }
      return cardDB.close();
    }
    if (!this.isWorkspaceDBClosed) {
      this.isWorkspaceDBClosed = true;
      if (workspaceDB === undefined || workspaceDB === null) {
        return Promise.resolve();
      }
      return workspaceDB.close();
    }
  };

  public loadOrCreateWorkspace = async (workspaceId: string) => {
    this.openWorkspaceDB();

    const workspace = ((await workspaceDB
      .get(workspaceId)
      .catch(() => undefined)) as unknown) as Workspace | undefined;

    if (workspace) {
      workspaces.set(workspaceId, {
        name: workspace['name'],
        avatars: workspace['avatars'],
      });
    }
    else {
      if (workspaces.size === 0) {
        // Check if initial launch
        this.openCardDB();
        const ids = await cardDB.allDocs().catch(() => undefined);
        if (ids && ids.rows.length > 0) {
          const urls = ids.rows.map(row => 'reactivedt://local/avatar/0/' + row.id);
          // Old version exists
          workspaces.set(workspaceId, {
            name: MESSAGE('workspaceName', `${workspaceId + 1}`),
            avatars: urls,
          });
        }
        else {
          // Create initial workspace
          workspaces.set(workspaceId, {
            name: MESSAGE('workspaceName', `${workspaceId + 1}`),
            avatars: [],
          });
        }
      }
      else {
        // Create new workspace
        workspaces.set(workspaceId, {
          name: MESSAGE('workspaceName', `${workspaceId}`),
          avatars: [],
        });
      }
      // Save new workspace
      const wsObj = {
        _id: workspaceId,
        _rev: '',
        ...workspaces.get(workspaceId),
      };

      await workspaceDB.put(wsObj).then(res => {
        console.debug(`Workspace saved: ${res.id}`);
        return res.id;
      });
    }
  };

  public getAvatarUrlList = async (workspaceId: string) => {
    if (!workspaces.has(workspaceId)) {
      await this.loadOrCreateWorkspace(workspaceId);
    }
    return workspaces.get(workspaceId)!.avatars;
  };

  public addAvatarUrl = async (workspaceId: string, avatarUrl: string) => {
    this.openWorkspaceDB();
    const wsObj: { _id: string; _rev: string } & Workspace = {
      _id: workspaceId,
      _rev: '',
      name: '',
      avatars: [avatarUrl],
    };
    await workspaceDB
      .get(workspaceId)
      .then(oldWS => {
        // Update existing card
        const { name, avatars } = (oldWS as unknown) as Workspace;
        wsObj._rev = oldWS._rev;
        wsObj.name = name;
        wsObj.avatars.push(...avatars);
      })
      .catch(e => {
        throw e;
      });

    return workspaceDB
      .put(wsObj)
      .then(res => {
        console.debug(`Workspace saved: ${res.id}`);
      })
      .catch(e => {
        throw e;
      });
  };

  public deleteAvatarUrl = async (workspaceId: string, avatarUrl: string) => {
    this.openWorkspaceDB();
    const wsObj: { _id: string; _rev: string } & Workspace = {
      _id: workspaceId,
      _rev: '',
      name: '',
      avatars: [],
    };
    await workspaceDB
      .get(workspaceId)
      .then(oldWS => {
        // Update existing card
        const { name, avatars } = (oldWS as unknown) as Workspace;
        wsObj._rev = oldWS._rev;
        wsObj.name = name;
        wsObj.avatars = avatars.filter(url => url !== avatarUrl);
      })
      .catch(e => {
        throw e;
      });

    return workspaceDB
      .put(wsObj)
      .then(res => {
        console.debug(`Delete avatar: ${avatarUrl}`);
      })
      .catch(e => {
        throw e;
      });
  };

  public getCardIdList = (): Promise<string[]> => {
    // returns all card ids.
    this.openCardDB();
    return new Promise((resolve, reject) => {
      cardDB
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
    this.openCardDB();
    const card = await cardDB.get(id);
    await cardDB.remove(card).catch(e => {
      throw e;
    });
    return id;
  };

  public getCardData = (id: string): Promise<CardProp> => {
    // for debug
    // await sleep(60000);
    this.openCardDB();
    return new Promise((resolve, reject) => {
      cardDB
        .get(id)
        .then(doc => {
          const propsRequired: CardPropSerializable = new CardProp('').toObject();

          // Check versions and compatibility
          let isFirstVersion = false;
          if (!Object.prototype.hasOwnProperty.call(doc, 'version')) {
            isFirstVersion = true;
          }

          if (isFirstVersion) {
            // The first version has no version property.
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

          if (isFirstVersion) {
            this.updateOrCreateCardData(prop);
          }

          resolve(prop);
        })
        .catch(e => {
          reject(e);
        });
    });
  };

  public updateOrCreateCardData = async (prop: CardProp): Promise<string> => {
    this.openCardDB();
    console.debug('Saving card...: ' + JSON.stringify(prop.toObject()));
    // In PouchDB, _id must be used instead of id in document.
    // Convert class to Object to serialize.
    const propObj = Object.assign({ _id: prop.id, _rev: '' }, prop.toObject());
    delete propObj.id;

    // for debug
    // await sleep(60000);

    await cardDB
      .get(prop.id)
      .then(oldCard => {
        // Update existing card
        propObj._rev = oldCard._rev;
      })
      .catch(() => {
        /* Create new card */
      });

    return cardDB
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
