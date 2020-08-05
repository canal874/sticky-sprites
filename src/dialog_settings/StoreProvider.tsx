/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { ipcRenderer } from 'electron';
import { GlobalAction, GlobalState, initialState } from '../modules_main/store.types';

/**
 * The function of localReducer is just copying GlobalState from Main process to Renderer process.
 */
const localReducer = (state: GlobalState, action: GlobalAction) => {
  if (action.type === 'CopyState') {
    return action.payload;
  }
  return state;
};

// 'GlobalState' is used both Main process and this Renderer process.
// ! Notice that it is not shared with Main and Renderer processes by reference,
// ! but individually bound to each process.
export type GlobalProvider = [GlobalState, (action: GlobalAction) => void];
export const GlobalContext = React.createContext<GlobalState | any>(initialState);

/**
 * Local Redux Store used only in this Renderer process
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
    localReducer,
    initialState
  ) as GlobalProvider;

  // Proxy dispatch to Main process
  const globalDispatch = async (action: GlobalAction) => {
    // IPC
    const state = await ipcRenderer.invoke('globalDispatch', action);
    // Copy GlobalState from Main process to this Renderer process
    // localDispatch({ type: 'CopyState', payload: state });
  };

  React.useEffect(() => {
    // Add listener that is invoked when global store in Main process is changed
    const dispatch = (event: Electron.IpcRendererEvent, state: GlobalState) => {
      // Copy GlobalState from Main process to this Renderer process
      localDispatch({ type: 'CopyState', payload: state });
    };
    ipcRenderer.on('globalStoreChanged', dispatch);
    const cleanup = () => {
      ipcRenderer.off('globalStoreChanged', dispatch);
    };
    return cleanup;
  }, []);

  const [state, dispatch]: SettingsDialogProvider = React.useReducer(
    SettingsDialogReducer,
    {
      activeSettingId: props.defaultSettingId,
      previousActiveSettingId: '',
    }
  );

  return (
    <GlobalContext.Provider value={[globalState, globalDispatch]}>
      <SettingsDialogContext.Provider value={[state, dispatch]}>
        {props.children}
      </SettingsDialogContext.Provider>
    </GlobalContext.Provider>
  );
};
