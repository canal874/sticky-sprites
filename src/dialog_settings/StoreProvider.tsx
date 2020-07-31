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
import { Settings } from '../modules_common/settings';

/**
 * State of App Settings updated by dispatcher
 */
// eslint-disable-next-line import/no-mutable-exports

/**
 * Global State referred by child nodes
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
 * State of Settings Dialog updated by dispatcher
 */
export interface SettingsDialogState {
  activeSettingId: string;
}
export interface SettingsDialogAction {
  payload: SettingsDialogState;
}
const SettingsDialogReducer = (
  state: SettingsDialogState,
  action: SettingsDialogAction
) => {
  return action.payload;
};
export const DispatchContext = React.createContext<SettingsDialogState | any>('');
export type DispatchProvider = [SettingsDialogState, React.Dispatch<SettingsDialogAction>];
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
  /**
   * Load data from Main process
   */
  React.useEffect(() => {
    let unmounted = false;
    const load = async () => {
      const messages: Messages = await ipcRenderer.invoke('get-i18n');
      const settings: Settings = await ipcRenderer.invoke('get-settings');
      if (!unmounted) {
        const getI18nMessage = (label: MessageLabel) => {
          return messages[label as MessageLabel];
        };
        messageDispatch({ payload: { MESSAGE: getI18nMessage } });
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
  };
  const [state, dispatch]: DispatchProvider = React.useReducer(
    SettingsDialogReducer,
    initialState
  );

  return (
    <MessageContext.Provider value={messageState}>
      <DispatchContext.Provider value={[state, dispatch]}>
        {props.children}
      </DispatchContext.Provider>
    </MessageContext.Provider>
  );
};
