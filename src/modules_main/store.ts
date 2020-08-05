/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import Store from 'electron-store';
import { app, BrowserWindow, ipcMain } from 'electron';
import { createStore } from 'redux';
import { selectPreferredLanguage, translate } from 'typed-intl';
import {
  availableLanguages,
  defaultLanguage,
  English,
  Japanese,
  MessageLabel,
} from '../modules_common/i18n';
import { emitter } from './event';
import { GlobalAction, GlobalState, GlobalStateKeys, initialState } from './store.types';

/**
 * i18n
 */
const translations = translate(English).supporting('ja', Japanese);

/**
 * Media stickies data store path
 * * '../../../../../../media_stickies_data' is default path when using asar created by squirrels.windows.
 * * './media_stickies_data' is default path when starting from command line (npm start).
 * * They can be distinguished by using app.isPackaged
 *
 * TODO: Default path for Mac / Linux is needed.
 */

const defaultCardDir = app.isPackaged
  ? path.join(__dirname, '../../../../../../media_stickies_data')
  : './media_stickies_data';

/**
 * electron-store for individual settings (a.k.a local machine settings)
 *
 * * Individual settings are serialized into config.json
 * * It is saved to:
 * * app.isPackaged == true ? C:\Users\{UserName}\AppData\Roaming\Media Stickies
 * *                        : Project root directory (/media_stickies)
 * TODO: config.json path for Mac / Linux is needed.
 */

const electronStore = new Store({
  cwd: app.isPackaged ? './' : path.join(__dirname, '../../'),
});

/**
 * Redux for individual settings
 * Individual settings are deserialized into Global Redux store.
 */

/**
 * Redux globalReducer
 * * Main process has globalReducer, while Renderer process has localReducer.
 * * The reducer for the global Redux store is globalReducer.
 * * The function of localReducer is just copying GlobalState from Main process to Renderer process.
 */
const globalReducer = (state: GlobalState = initialState, action: GlobalAction) => {
  if (action.type === 'cardDir') {
    electronStore.set(action.type, action.payload);
    return { ...state, cardDir: action.payload };
  }
  else if (action.type === 'i18n') {
    const language = action.payload;
    electronStore.set(action.type, language);
    selectPreferredLanguage(availableLanguages, [language, defaultLanguage]);

    return {
      ...state,
      i18n: { language: action.payload, messages: translations.messages() },
    };
  }
  return state;
};

/**
 * Global Redux Store
 */
const store = createStore(globalReducer);

/**
 * Redux Dispatches
 */

// Dispatch request from Renderer process
ipcMain.handle('globalDispatch', (event, action: GlobalAction) => {
  store.dispatch(action);
  return store.getState();
});

/**
 * Subscriber
 * Add Renderer process as a subscriber
 */
export const subscribeStore = (win: BrowserWindow) => {
  win.webContents.send('globalStoreChanged', store.getState());
  const unsubscribe = store.subscribe(() => {
    emitter.emit('updateTrayContextMenu');
    win.webContents.send('globalStoreChanged', store.getState());
  });
  return unsubscribe;
};

/**
 * Utilities
 */

// API for getting local settings
export const getSettings = () => {
  return store.getState();
};

// API for globalDispatch
export const globalDispatch = (action: GlobalAction) => {
  store.dispatch(action);
};

/**
 * Deserializing data from electron-store
 */
export const initializeGlobalStore = (preferredLanguage: string) => {
  const loadOrCreate = (key: GlobalStateKeys, defaultValue: any) => {
    const value: any = electronStore.get(key, defaultValue);
    globalDispatch({ type: key, payload: value });
  };

  loadOrCreate('cardDir', defaultCardDir);
  loadOrCreate('i18n', preferredLanguage);
};

/**
 * Utility for i18n
 */
export const MESSAGE = (label: MessageLabel) => {
  return getSettings().i18n.messages[label];
};
