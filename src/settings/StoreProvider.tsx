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
/**
 * State of Settings Dialog updated by dispatcher
 */
export interface SettingsDialogState {
  activeSettingId: string;
}
export interface SettingsDialogAction {
  payload: SettingsDialogState;
}
export const DispatchContext = React.createContext<SettingsDialogState | any>('');
export type DispatchProvider = [SettingsDialogState, React.Dispatch<SettingsDialogAction>];

const SettingsDialogReducer = (
  state: SettingsDialogState,
  action: SettingsDialogAction
) => {
  return action.payload;
};

/**
 * Global State referred by child nodes
 */
// eslint-disable-next-line import/no-mutable-exports
export let MessageContext: React.Context<(label: MessageLabel) => string>;
export const setMessageContext = (currentMessages: Messages) => {
  const MESSAGE = (label: MessageLabel) => {
    return currentMessages[label as MessageLabel];
  };
  MessageContext = React.createContext(MESSAGE);
};

export const StoreProvider = (props: {
  initialState: SettingsDialogState;
  children: React.ReactNode;
}) => {
  const MESSAGE = React.useContext(MessageContext);
  const [state, dispatch]: DispatchProvider = React.useReducer(
    SettingsDialogReducer,
    props.initialState
  );
  return (
    <MessageContext.Provider value={MESSAGE}>
      <DispatchContext.Provider value={[state, dispatch]}>
        {props.children}
      </DispatchContext.Provider>
    </MessageContext.Provider>
  );
};
