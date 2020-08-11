/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import { app, Menu, Tray } from 'electron';
import { openSettings, settingsDialog } from './settings';
import { getSettings, MESSAGE } from './store';
import { Card, cards } from './card';
import { emitter } from './event';
import {
  CardProp,
  CardPropSerializable,
  DEFAULT_CARD_GEOMETRY,
  Geometry,
} from '../modules_common/cardprop';
import { getRandomInt } from '../modules_common/utils';

/**
 * Task tray
 */

// Ensure a reference to Tray object is retained, or it will be GC'ed.
let tray: Tray;
export const destroyTray = () => {
  if (tray !== undefined && !tray.isDestroyed()) {
    tray.destroy();
  }
};

let currentLanguage: string;

const createNewCard = () => {
  const geometry = JSON.parse(JSON.stringify(DEFAULT_CARD_GEOMETRY));
  geometry.x += getRandomInt(30, 100);
  geometry.y += getRandomInt(30, 100);
  const propObject: Geometry = {
    x: geometry.x,
    y: geometry.y,
    z: geometry.z + 1,
    width: geometry.width,
    height: geometry.height,
  };
  const card = new Card('New', CardProp.fromObject(propObject as CardPropSerializable));
  cards.set(card.prop.id, card);
  card.render();
  card.window.focus();
};

export const setTrayContextMenu = () => {
  if (!tray) {
    return;
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: MESSAGE('newCard'),
      click: () => {
        createNewCard();
      },
    },
    {
      label: MESSAGE('settings'),
      click: () => {
        openSettings();
      },
    },
    {
      label: MESSAGE('exit'),
      click: () => {
        if (settingsDialog && !settingsDialog.isDestroyed()) {
          settingsDialog.close();
        }
        cards.forEach((card, key) => card.window.webContents.send('card-close'));
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  let taskTrayToolTip = MESSAGE('trayToolTip');
  if (!app.isPackaged) {
    taskTrayToolTip += ' (Development)';
  }
  tray.setToolTip(taskTrayToolTip);
};

export const initializeTaskTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/media_stickies_grad_icon.ico'));
  currentLanguage = getSettings().persistent.language;
  setTrayContextMenu();
  tray.on('click', () => {
    createNewCard();
  });
};

emitter.on('updateTrayContextMenu', () => {
  const newLanguage = getSettings().persistent.language;
  if (currentLanguage !== newLanguage) {
    currentLanguage = newLanguage;
    setTrayContextMenu();
  }
});
