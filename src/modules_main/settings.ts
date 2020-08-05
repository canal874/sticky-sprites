/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import electronConnect from 'electron-connect';
import { MESSAGE, subscribeStore } from './store';

// eslint-disable-next-line import/no-mutable-exports
export let settingsDialog: BrowserWindow;

export const openSettings = () => {
  if (settingsDialog !== undefined && !settingsDialog.isDestroyed()) {
    return;
  }

  settingsDialog = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
    },
    width: 800,
    height: 360,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    icon: path.join(__dirname, '../../assets/media_stickies_grad_icon.ico'),
  });

  // hot reload
  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    electronConnect.client.create(settingsDialog);
    settingsDialog.webContents.openDevTools();
  }

  settingsDialog.loadURL(path.join(__dirname, '../settings/settings.html'));
  settingsDialog.webContents.on('did-finish-load', () => {
    const unsubscribe = subscribeStore(settingsDialog);
    settingsDialog.on('close', () => {
      unsubscribe();
    });
  });
};

// Dispatch request from Renderer process
ipcMain.handle('open-directory-selector-dialog', event => {
  return openDirectorySelectorDialog();
});

const openDirectorySelectorDialog = () => {
  const file: string[] | undefined = dialog.showOpenDialogSync(settingsDialog, {
    properties: ['openDirectory'],
    title: MESSAGE('chooseSaveFilePath'),
    message: MESSAGE('chooseSaveFilePath'), // macOS only
  });
  return file;
};
