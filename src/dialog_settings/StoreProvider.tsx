/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { ipcRenderer } from 'electron';
import { MessageLabel, Messages } from '../modules_common/i18n';
import { Settings, settings } from '../modules_common/settings';

/**
 * App Settings state updated by dispatcher
 */
export interface AppSettingsState {
  settings: Settings;
}
export interface AppSettingsAction {
  payload: AppSettingsState;
}
const AppSettingsReducer = (state: AppSettingsState, action: AppSettingsAction) => {
  return action.payload;
};
export type AppSettingsProvider = [AppSettingsState, React.Dispatch<AppSettingsAction>];
const initialAppSettingsState = {
  settings: settings, // This is not settings from Main process, but from individually loaded modules_common/settings module.
};
export const AppSettingsContext = React.createContext<AppSettingsState | any>(
  initialAppSettingsState
);

/**
 * i18n Message state referred by child nodes
 */
export interface MessageState {
  MESSAGE: (label: MessageLabel) => string;
}
export interface MessageAction {
  payload: MessageState;
}
const MessagesReducer = (state: MessageState, action: MessageAction) => {
  return action.payload;
};
export type MessagesProvider = [MessageState, React.Dispatch<MessageAction>];
const initialMessageState = {
  MESSAGE: (label: string) => '',
};
export const MessageContext = React.createContext<MessageState>(initialMessageState);

/**
 * Settings Dialog Operating updated by dispatcher
 */
export interface SettingsDialogState {
  activeSettingId: string;
  previousActiveSettingId: string;
}
export interface SettingsDialogAction {
  activeSettingId: string;
}
const SettingsDialogReducer = (
  state: SettingsDialogState,
  action: SettingsDialogAction
) => {
  const nextState: SettingsDialogState = {
    activeSettingId: action.activeSettingId,
    previousActiveSettingId: state.activeSettingId,
  };
  return nextState;
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
  const [messageState, messageDispatch] = React.useReducer(
    MessagesReducer,
    initialMessageState
  );
  const [appSettingsState, appSettingsDispatch] = React.useReducer(
    AppSettingsReducer,
    initialAppSettingsState
  );
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
        messageDispatch({ payload: { MESSAGE: getI18nMessage } });
      }

      const mySettings: Settings = await ipcRenderer.invoke('get-settings');
      if (!unmounted) {
        appSettingsDispatch({ payload: { settings: mySettings } });
      }
    };
    load();

    const cleanup = () => {
      unmounted = true;
    };
    return cleanup;
  });

  const initialState: SettingsDialogState = {
    activeSettingId: props.defaultSettingId,
    previousActiveSettingId: '',
  };
  const [state, dispatch]: SettingsDialogProvider = React.useReducer(
    SettingsDialogReducer,
    initialState
  );

  return (
    <MessageContext.Provider value={messageState}>
      <AppSettingsContext.Provider value={[appSettingsState, appSettingsDispatch]}>
        <SettingsDialogContext.Provider value={[state, dispatch]}>
          {props.children}
        </SettingsDialogContext.Provider>
      </AppSettingsContext.Provider>
    </MessageContext.Provider>
  );
};
