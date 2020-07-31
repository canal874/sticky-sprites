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
import { StoreProvider } from './StoreProvider';

export interface SettingsDialogProps {
  menu: MenuListProps;
  defaultSettingId: string;
}

export const SettingsDialog = (props: SettingsDialogProps) => {
  return (
    <div styleName='settingsDialog'>
      <StoreProvider defaultSettingId={props.defaultSettingId}>
        <MenuList title={props.menu.title} items={props.menu.items} />
        <SettingPages items={props.menu.items} />
      </StoreProvider>
    </div>
  );
};
