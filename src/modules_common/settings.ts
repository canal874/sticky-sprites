/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import Store from 'electron-store';
import { app } from 'electron';
import { getCurrentMessages } from './i18n';

// '../../../../../../media_stickies_data' is default path when using asar created by squirrels.windows.
// './media_stickies_data' is default path when starting from command line (npm start).
// They can be distinguished by using process.defaultApp
// TODO: Default path for Mac / Linux is needed.

// config.json is saved to
// app.isPackaged is true : C:\Users\{UserName}\AppData\Roaming\Media Stickies
// app.isPackaged is false: Project root directory (/media_stickies)

export type Settings = {
  cardDir: string;
  language: string;
};
export type SettingsLabel = keyof Settings;

export const settings: Settings = {
  cardDir: '',
  language: '',
};

const loadOrCreate = (store: Store, key: SettingsLabel, defaultValue: any) => {
  const value: any = store.get(key, defaultValue);
  if (value !== settings[key]) {
    store.set(key, value);
  }
  settings[key] = value;
};

export const loadSettings = () => {
  const store = new Store({ cwd: app.isPackaged ? './' : path.join(__dirname, '../../') });
  const defaultCardDir = app.isPackaged
    ? path.join(__dirname, '../../../../../../media_stickies_data')
    : './media_stickies_data';
  loadOrCreate(store, 'cardDir', defaultCardDir);

  const [currentLanguage] = getCurrentMessages();
  loadOrCreate(store, 'language', currentLanguage);

  console.debug(`Local config file: ${store.path}`);
};
