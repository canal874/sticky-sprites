/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { app, ipcMain } from 'electron';
import { selectPreferredLanguage } from 'typed-intl';
import { logger } from './modules_common/utils';
import translations from './modules_common/base.msg';
import { CardProp, CardPropSerializable } from './modules_common/cardprop';
import { CardIO } from './modules_ext/io';
import { Card, cards } from './modules_main/card';
import { setGlobalFocusEventListenerPermission } from './modules_main/global';
//import { sleep } from './modules_common/utils';

//process.on('unhandledRejection', console.dir);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// Increase max listeners
ipcMain.setMaxListeners(1000);

/**
 * i18n
 */
export let MESSAGE: Object = {};

/**
 * Card I/O
 */
ipcMain.handle('save', async (event, cardPropObj: CardPropSerializable) => {
  const prop = CardProp.fromObject(cardPropObj);

  // for debug
  // await sleep(10000);

  CardIO.writeOrCreateCardData(prop)
    .then(() => {
      const card = cards.get(prop.id);
      if (card) {
        card.prop = prop;
      }
      else {
        throw 'The card is not registered in cards.';
      }
    })
    .catch((err: string) => {
      logger.debug(err);
    });
});

export const deleteCard = (prop: CardProp) => {
  CardIO.deleteCardData(prop.id)
    .catch((err: string) => {
      logger.error(err);
    })
    .then(() => {
      logger.debug('deleted :' + prop.id);
      cards.get(prop.id)?.window.webContents.send('card-close');
    });
};

export const createCard = () => {
  const card = new Card();
  card
    .render()
    .then(() => {
      cards.set(card.id, card);
    })
    .catch(e => {
      logger.error(`Error in createCard(): ${e}`);
    });
};

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on('ready', () => {
  // locale can be got after 'ready'
  logger.debug('locale: ' + app.getLocale());
  selectPreferredLanguage(['en', 'ja'], [app.getLocale(), 'en']);
  MESSAGE = translations.messages();

  // load cards
  CardIO.getCardIdList()
    .then((arr: Array<string>) => {
      if (arr.length == 0) {
        // Create a new card
        const card = new Card();
        card
          .render()
          .then(() => {
            cards.set(card.id, card);
          })
          .catch(e => {
            logger.error(`Error while creating card in ready event: ${e}`);
          });
      }
      else {
        for (let id of arr) {
          const card = new Card(id);
          card
            .render()
            .then(() => {
              cards.set(id, card);
            })
            .catch(e => {
              logger.error(`Error while loading card in ready event: ${e}`);
            });
        }
      }
    })
    .catch((err: string) => {
      logger.error(`Cannot load a list of cards: ${err}`);
    });
});

/**
 * Exit app
 */
app.on('window-all-closed', () => {
  app.quit();
});

/**
 * Utils
 */
export const setWindowSize = (id: string, width: number, height: number) => {
  const card = cards.get(id);
  card?.window.setSize(width, height);
};

ipcMain.handle('blurAndFocus', async (event, id: string) => {
  const card = cards.get(id);
  if (card) {
    console.debug(`blurAndFocus: ${id}`);
    /**
     * When a card is blurred, another card will be focused automatically by OS.
     * Set suppressGlobalFocusEvent to suppress to focus another card.
     */
    setGlobalFocusEventListenerPermission(false);
    card.suppressBlurEventOnce = true;
    card.window.blur();
    card.suppressFocusEventOnce = true;
    card.window.focus();
  }
});
