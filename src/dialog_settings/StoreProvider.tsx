/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { ipcRenderer } from 'electron';
import { MessageLabel } from '../modules_common/i18n';
import { Settings, settings } from '../modules_common/settings';

/**
 * Globals fetched from Main process
 */
export interface GlobalState {
  MESSAGE: (label: MessageLabel) => string;
  settings: Settings;
}
export type MessageAction = {
  type: 'UpdateMessage';
  payload: (label: MessageLabel) => string;
};
export type CardDirSettingAction = {
  type: 'UpdateCardDirSetting';
  payload: string;
};
export type LanguageSettingAction = {
  type: 'UpdateLanguageSetting';
  payload: string;
};

export type GlobalAction = MessageAction | CardDirSettingAction | LanguageSettingAction;
const GlobalReducer = (state: GlobalState, action: GlobalAction) => {
  if (action.type === 'UpdateMessage') {
    return { ...state, MESSAGE: action.payload };
  }
  else if (action.type === 'UpdateCardDirSetting') {
    return { ...state, settings: { ...state.settings, cardDir: action.payload } };
  }
  else if (action.type === 'UpdateLanguageSetting') {
    return { ...state, settings: { ...state.settings, language: action.payload } };
  }

  return state;
};

export type GlobalProvider = [GlobalState, React.Dispatch<GlobalAction>];
const initialGlobalState: GlobalState = {
  MESSAGE: (label: string) => '',
  settings: settings, // This is not settings from Main process, but from individually loaded modules_common/settings module.
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
  const [globalState, globalDispatch] = React.useReducer(GlobalReducer, initialGlobalState);

  /**
   * Load data from Main process
   */
  React.useEffect(() => {
    let unmounted = false;
    const load = async () => {
      const [language, myMessages] = await ipcRenderer.invoke('get-i18n');
      if (!unmounted) {
        const getI18nMessage = (label: MessageLabel) => {
          return myMessages[label as MessageLabel];
        };
        globalDispatch({ type: 'UpdateMessage', payload: getI18nMessage });
      }
      const mySettings: Settings = await ipcRenderer.invoke('get-settings');
      if (!unmounted) {
        globalDispatch({ type: 'UpdateLanguageSetting', payload: mySettings.language });
        globalDispatch({ type: 'UpdateCardDirSetting', payload: mySettings.cardDir });
      }
    };
    load();

    const cleanup = () => {
      unmounted = true;
    };
    return cleanup;
  }, []); // Execute only once by using 2nd argument []

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
