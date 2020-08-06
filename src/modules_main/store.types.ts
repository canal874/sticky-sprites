/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { English, Messages } from '../modules_common/i18n';

export const cardDirName = 'media_stickies_data';

/**
 * Redux State
 * ! A key of the GlobalState (that is deserialized data) must be same as
 * ! a key of the electron-store (that is serialized data)
 */
export interface GlobalState {
  cardDir: string;
  i18n: {
    language: string;
    messages: Messages; // 'messages' is not serialized. It is set and updated when 'language' is changed.
  };
}
export type GlobalStateKeys = keyof GlobalState;

/**
 * Redux Actions
 * ! 'type' for updating GlobalState must be same as one of GlobalStateKeys
 */

export type CardDirSettingAction = {
  type: 'cardDir';
  payload: string;
};

export type I18nSettingAction = {
  type: 'i18n';
  payload: string;
};

// CopyStateAction is used only in the localReducer of Renderer process
export type CopyStateAction = {
  type: 'CopyState';
  payload: GlobalState;
};

export type GlobalAction = CardDirSettingAction | I18nSettingAction | CopyStateAction;

export const initialState: GlobalState = {
  cardDir: '',
  i18n: { language: '', messages: English },
};
