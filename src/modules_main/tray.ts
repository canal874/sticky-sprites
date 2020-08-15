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
  CardStyle,
  DEFAULT_CARD_GEOMETRY,
  Geometry,
} from '../modules_common/cardprop';
import { getRandomInt } from '../modules_common/utils';
import { cardColors, ColorName, darkenHexColor } from '../modules_common/color';

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
let color = { ...cardColors };
delete color.transparent;

const createNewCard = async () => {
  const geometry = { ...DEFAULT_CARD_GEOMETRY };
  geometry.x += getRandomInt(30, 100);
  geometry.y += getRandomInt(30, 100);

  let colorList = Object.entries(color);
  if (colorList.length === 0) {
    color = { ...cardColors };
    delete color.transparent;
    colorList = Object.entries(color);
  }
  const newColor: ColorName = colorList[getRandomInt(0, colorList.length)][0] as ColorName;
  delete color[newColor];

  const bgColor: string = cardColors[newColor];

  const newGeometry: Geometry = {
    x: geometry.x,
    y: geometry.y,
    z: geometry.z,
    width: geometry.width,
    height: geometry.height,
  };
  const newStyle: CardStyle = {
    uiColor: darkenHexColor(bgColor),
    backgroundColor: bgColor,
    opacity: 1.0,
    zoom: 1.0,
  };
  const card = new Card(
    'New',
    CardProp.fromObject({ ...newGeometry, ...newStyle } as CardPropSerializable)
  );
  cards.set(card.prop.id, card);
  await card.render();
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
