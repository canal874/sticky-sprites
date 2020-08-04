/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { ipcRenderer } from 'electron';
import { GlobalAction, GlobalState } from '../modules_main/store';
import { English } from '../modules_common/i18n';

/**
 * Globals fetched from Main process
 */

const LocalReducer = (state: GlobalState, action: GlobalAction) => {
  if (action.type === 'CopyState') {
    return action.payload;
  }
  return state;
};

// 'GlobalState' and 'settings' is used both Main process and this Renderer process.
// Notice that they are not shared by reference, but individually bound to those in modules_main/settings module.
export type GlobalProvider = [GlobalState, (action: GlobalAction) => void];
const initialGlobalState: GlobalState = {
  cardDir: '',
  i18n: { language: '', messages: English },
};
export const GlobalContext = React.createContext<GlobalState | any>(initialGlobalState);

/**
 * Settings Dialog Operating updated by dispatcher
 */
export interface SettingsDialogState {
  activeSettingId: string;
  previousActiveSettingId: string;
}
export interface SettingsDialogAction {
  type: 'UpdateActiveSetting';
  activeSettingId: string;
}

const SettingsDialogReducer = (
  state: SettingsDialogState,
  action: SettingsDialogAction
) => {
  if (action.type === 'UpdateActiveSetting') {
    const nextState: SettingsDialogState = {
      activeSettingId: action.activeSettingId,
      previousActiveSettingId: state.activeSettingId,
    };
    return nextState;
  }

  return state;
};
export const SettingsDialogContext = React.createContext<SettingsDialogState | any>('');
export type SettingsDialogProvider = [
  SettingsDialogState,
  React.Dispatch<SettingsDialogAction>
];

/**
 * StoreProvider
 */
export const StoreProvider = (props: {
  defaultSettingId: string;
  children: React.ReactNode;
}) => {
  const [globalState, localDispatch] = React.useReducer(
    LocalReducer,
    initialGlobalState
  ) as GlobalProvider;

  // Proxy dispatch to Main process
  const globalDispatch = async (action: GlobalAction) => {
    const state = await ipcRenderer.invoke('globalDispatch', action);
    // Copy state from Main process to local state
    localDispatch({ type: 'CopyState', payload: state });
  };

  React.useEffect(() => {
    const dispatch = (event: Electron.IpcRendererEvent, state: GlobalState) => {
      localDispatch({ type: 'CopyState', payload: state });
    };
    ipcRenderer.on('globalStateChanged', dispatch);
    const cleanup = () => {
      ipcRenderer.off('globalStateChanged', dispatch);
    };
    return cleanup;
  }, []);

  const initialState: SettingsDialogState = {
    activeSettingId: props.defaultSettingId,
    previousActiveSettingId: '',
  };
  const [state, dispatch]: SettingsDialogProvider = React.useReducer(
    SettingsDialogReducer,
    initialState
  );

  return (
    <GlobalContext.Provider value={[globalState, globalDispatch]}>
      <SettingsDialogContext.Provider value={[state, dispatch]}>
        {props.children}
      </SettingsDialogContext.Provider>
    </GlobalContext.Provider>
  );
};
