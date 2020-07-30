/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { MenuList, MenuListProps } from './MenuList';
import { SettingPages } from './SettingPages';
import './SettingsDialog.css';
import { SettingsDialogState, StoreProvider } from './Store';

export interface SettingsDialogProps {
  menu: MenuListProps;
  defaultSettingName: string;
}

export const SettingsDialog = (props: SettingsDialogProps) => {
  const initialState: SettingsDialogState = {
    activeSettingName: props.defaultSettingName,
  };
  return (
    <div styleName='settingsDialog'>
      <StoreProvider initialState={initialState}>
        <MenuList title={props.menu.title} items={props.menu.items} />
        <SettingPages items={props.menu.items} />
      </StoreProvider>
    </div>
  );
};
