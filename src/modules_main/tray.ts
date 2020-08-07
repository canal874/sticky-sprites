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
import { cards } from './card';
import { emitter } from './event';

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

export const setTrayContextMenu = () => {
  if (!tray) {
    return;
  }
  const contextMenu = Menu.buildFromTemplate([
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
  currentLanguage = getSettings().i18n.language;
  setTrayContextMenu();
  tray.on('click', () => {
    openSettings();
  });
};

emitter.on('updateTrayContextMenu', () => {
  const newLanguage = getSettings().i18n.language;
  if (currentLanguage !== newLanguage) {
    currentLanguage = newLanguage;
    setTrayContextMenu();
  }
});
