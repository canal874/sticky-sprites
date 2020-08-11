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
import { combineReducers, createStore } from 'redux';
import { selectPreferredLanguage, translate } from 'typed-intl';
import {
  availableLanguages,
  defaultLanguage,
  English,
  Japanese,
  MessageLabel,
} from '../modules_common/i18n';
import { emitter } from './event';
import {
  cardDirName,
  initialPersistentSettingsState,
  initialTemporalSettingsState,
  PersistentSettingsAction,
  PersistentSettingsState,
  PersistentSettingsStateKeys,
  TemporalSettingsAction,
  TemporalSettingsState,
} from './store.types';

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
  ? path.join(__dirname, `../../../../../../${cardDirName}`)
  : path.join(__dirname, `../../${cardDirName}`);

const defaultStorage = {
  type: 'local',
  path: defaultCardDir,
};

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

const persistent = (
  state: PersistentSettingsState = initialPersistentSettingsState,
  action: PersistentSettingsAction
) => {
  if (action.type === 'storage-put') {
    return { ...state, storage: action.payload };
  }
  else if (action.type === 'language-put') {
    return {
      ...state,
      language: action.payload,
    };
  }
  else if (action.type === 'navigationAllowedURLs-put') {
    const targetUrl = action.payload;
    const urls = state.navigationAllowedURLs.slice();
    if (typeof targetUrl === 'string') {
      urls.push(targetUrl);
    }
    else if (Array.isArray(targetUrl)) {
      targetUrl.forEach(item => {
        urls.push(item);
      });
    }
    urls.sort();
    return {
      ...state,
      navigationAllowedURLs: urls,
    };
  }
  else if (action.type === 'navigationAllowedURLs-delete') {
    const targetUrl = action.payload;
    const urls = state.navigationAllowedURLs.slice();
    if (typeof targetUrl === 'string') {
      urls.splice(urls.indexOf(targetUrl), 1);
    }
    else if (Array.isArray(targetUrl)) {
      targetUrl.forEach(item => {
        urls.splice(urls.indexOf(item), 1);
      });
    }
    urls.sort();
    return {
      ...state,
      navigationAllowedURLs: urls,
    };
  }
  return state;
};

const temporal = (
  state: TemporalSettingsState = initialTemporalSettingsState,
  action: TemporalSettingsAction
) => {
  if (action.type === 'messages-put') {
    return {
      ...state,
      messages: action.payload,
    };
  }
  return state;
};

const globalReducer = combineReducers({
  persistent,
  temporal,
});

/**
 * Global Redux Store
 */

const store = createStore(globalReducer);

/**
 * Redux Dispatches
 */

// Dispatch request from Renderer process
ipcMain.handle('globalDispatch', (event, action: PersistentSettingsAction) => {
  store.dispatch(action);
});

/**
 * Add electron-store as as subscriber
 */
let previousState = initialPersistentSettingsState;
store.subscribe(() => {
  const currentState = store.getState().persistent;
  const updateIfChanged = (key: PersistentSettingsStateKeys) => {
    const isChanged = () => {
      const prevValue = previousState[key];
      const currentValue = currentState[key];
      if (typeof prevValue === 'string' && typeof currentValue === 'string') {
        return prevValue !== currentValue;
      }
      else if (Array.isArray(prevValue) && Array.isArray(currentValue)) {
        return JSON.stringify(prevValue) !== JSON.stringify(currentValue);
      }
      else if (typeof prevValue === 'object' && typeof currentValue === 'object') {
        return JSON.stringify(prevValue) !== JSON.stringify(currentValue);
      }
      console.error(
        `Error in updateIfChanged: Cannot handle ${key} : ${typeof prevValue} and ${typeof currentValue}`
      );
    };
    if (isChanged()) {
      previousState = currentState;
      electronStore.set(key, currentState[key]);
      return true;
    }
    return false;
  };
  updateIfChanged('storage');
  updateIfChanged('navigationAllowedURLs');
  if (updateIfChanged('language')) {
    selectPreferredLanguage(availableLanguages, [
      store.getState().persistent.language,
      defaultLanguage,
    ]);
    store.dispatch({ type: 'messages-put', payload: translations.messages() });
  }
});

/**
 * Add Renderer process as a subscriber
 */
export const subscribeStoreFromSettings = (subscriber: BrowserWindow) => {
  subscriber.webContents.send('globalStoreChanged', store.getState());
  const unsubscribe = store.subscribe(() => {
    emitter.emit('updateTrayContextMenu');
    subscriber.webContents.send('globalStoreChanged', store.getState());
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
export const globalDispatch = (action: PersistentSettingsAction) => {
  store.dispatch(action);
};

/**
 * Deserializing data from electron-store
 */
export const initializeGlobalStore = (preferredLanguage: string) => {
  const loadOrCreate = (key: string, defaultValue: any) => {
    const value: any = electronStore.get(key, defaultValue);
    store.dispatch({
      type: key + '-put',
      payload: value,
    } as PersistentSettingsAction);
  };

  loadOrCreate('storage', defaultStorage);
  loadOrCreate('language', preferredLanguage);
  loadOrCreate('navigationAllowedURLs', []);
};

/**
 * Utility for i18n
 */
export const MESSAGE = (label: MessageLabel, ...args: string[]) => {
  let message: string = getSettings().temporal.messages[label];
  if (args) {
    args.forEach((replacement, index) => {
      const variable = '$' + (index + 1); // $1, $2, ...
      message = message.replace(variable, replacement);
    });
  }
  return message;
};
