/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';

export interface SettingsDialogState {
  activeSettingName: string;
}

export interface SettingsDialogAction {
  payload: SettingsDialogState;
}
const init: SettingsDialogState = {
  activeSettingName: '',
};

export const Store = React.createContext<SettingsDialogState | any>(init);
export type StoreProvider = [SettingsDialogState, React.Dispatch<SettingsDialogAction>];

const reducer = (state: SettingsDialogState, action: SettingsDialogAction) => {
  return action.payload;
};

export const StoreProvider = (props: {
  initialState: SettingsDialogState;
  children: React.ReactNode;
}) => {
  const [state, dispatch] = React.useReducer(reducer, props.initialState);
  return <Store.Provider value={[state, dispatch]}>{props.children}</Store.Provider>;
};
