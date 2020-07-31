/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';

// '../../../../../../media_stickies_data' is default path when using asar created by squirrels.windows.
// './media_stickies_data' is default path when starting from command line (npm start).
// They can be distinguished by using process.defaultApp
// TODO: Default path for Mac / Linux is needed.

export type Settings = {
  cardDir: string;
};
export type SettingsLabel = keyof Settings;

export const settings: Settings = {
  cardDir: process.defaultApp
    ? './media_stickies_data'
    : path.join(__dirname, '../../../../../../media_stickies_data'),
};
