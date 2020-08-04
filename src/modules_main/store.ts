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
import { defaultLanguage, English, Messages } from '../modules_common/i18n';

// '../../../../../../media_stickies_data' is default path when using asar created by squirrels.windows.
// './media_stickies_data' is default path when starting from command line (npm start).
// They can be distinguished by using process.defaultApp
// TODO: Default path for Mac / Linux is needed.

// config.json is saved to
// app.isPackaged is true : C:\Users\{UserName}\AppData\Roaming\Media Stickies
// app.isPackaged is false: Project root directory (/media_stickies)

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
  language: string;
  messages: Messages;
}
type GlobalStateKeys = keyof GlobalState;

const initialState: GlobalState = {
  cardDir: defaultCardDir,
  language: defaultLanguage,
  messages: English,
};

/**
 * Redux Actions
 * 'type' for updating value must be same as one of GlobalStateKeys
 */

export type CardDirSettingAction = {
  type: 'cardDir';
  payload: string;
};

export type LanguageSettingAction = {
  type: 'language';
  payload: string;
};

export type MessagesAction = {
  type: 'messages';
  payload: Messages;
};

export type CopyStateAction = {
  type: 'CopyState';
  payload: GlobalState;
};

export type GlobalAction =
  | CardDirSettingAction
  | LanguageSettingAction
  | MessagesAction
  | CopyStateAction;

const globalReducer = (state: GlobalState = initialState, action: GlobalAction) => {
  if (action.type === 'cardDir') {
    electronStore.set(action.type, action.payload);
    return { ...state, cardDir: action.payload };
  }
  else if (action.type === 'language') {
    electronStore.set(action.type, action.payload);
    return { ...state, language: action.payload };
  }
  else if (action.type === 'messages') {
    return { ...state, messages: action.payload };
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

const loadOrCreate = (key: GlobalStateKeys, defaultValue: any) => {
  const value: any = electronStore.get(key, defaultValue);
  store.dispatch({ type: key, payload: value });
};

loadOrCreate('cardDir', defaultCardDir);
loadOrCreate('language', defaultLanguage);
