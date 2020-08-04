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
  Messages,
} from '../modules_common/i18n';
import { emitter } from './event';

// '../../../../../../media_stickies_data' is default path when using asar created by squirrels.windows.
// './media_stickies_data' is default path when starting from command line (npm start).
// They can be distinguished by using process.defaultApp
// TODO: Default path for Mac / Linux is needed.

// config.json is saved to
// app.isPackaged is true : C:\Users\{UserName}\AppData\Roaming\Media Stickies
// app.isPackaged is false: Project root directory (/media_stickies)

/**
 * i18n
 */
const translations = translate(English).supporting('ja', Japanese);

/**
 * Electron local store
 */
const electronStore = new Store({
  cwd: app.isPackaged ? './' : path.join(__dirname, '../../'),
});

const defaultCardDir = app.isPackaged
  ? path.join(__dirname, '../../../../../../media_stickies_data')
  : './media_stickies_data';

/**
 * Redux State
 */
export interface GlobalState {
  cardDir: string;
  i18n: {
    language: string;
    messages: Messages;
  };
}
type GlobalStateKeys = keyof GlobalState;

/**
 * Redux Actions
 * 'type' for updating value must be same as one of GlobalStateKeys
 */

export type CardDirSettingAction = {
  type: 'cardDir';
  payload: string;
};

export type I18nSettingAction = {
  type: 'i18n';
  payload: string;
};

export type CopyStateAction = {
  type: 'CopyState';
  payload: GlobalState;
};

export type GlobalAction = CardDirSettingAction | I18nSettingAction | CopyStateAction;

const globalReducer = (
  state: GlobalState = {
    cardDir: '',
    i18n: { language: '', messages: English },
  },
  action: GlobalAction
) => {
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

const store = createStore(globalReducer);

/**
 * Redux Dispatches
 */
ipcMain.handle('globalDispatch', (event, action: GlobalAction) => {
  store.dispatch(action);
  return store.getState();
});

export const subscribeStore = (win: BrowserWindow) => {
  win.webContents.send('globalStateChanged', store.getState());
  const unsubscribe = store.subscribe(() => {
    emitter.emit('updateTrayContextMenu');
    win.webContents.send('globalStateChanged', store.getState());
  });
  return unsubscribe;
};

export const getSettings = () => {
  return store.getState();
};

export const globalDispatch = (action: GlobalAction) => {
  store.dispatch(action);
};

/**
 * Load from electron local store
 */

export const initializeGlobalStore = (preferredLanguage: string) => {
  const loadOrCreate = (key: GlobalStateKeys, defaultValue: any) => {
    const value: any = electronStore.get(key, defaultValue);
    store.dispatch({ type: key, payload: value });
  };

  loadOrCreate('cardDir', defaultCardDir);
  loadOrCreate('i18n', preferredLanguage);
};

export const MESSAGE = (label: MessageLabel) => {
  return getSettings().i18n.messages[label];
};
