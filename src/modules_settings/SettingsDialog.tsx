/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { MenuList, MenuListProps } from './MenuList';

export interface SettingsDialogProps {
  menu: MenuListProps;
}
interface State {}

export class SettingsDialog extends React.Component<SettingsDialogProps, State> {
  render () {
    return (
      <div className='settingsDialog'>
        <MenuList
          title={this.props.menu.title}
          items={this.props.menu.items}
          defaultItem={this.props.menu.defaultItem}
        />
        {/*      <SettingsContent>
        <SaveSetting headline="Save"></SaveSetting>
        <PermissionSetting headline="Permission"></PermissionSetting>
      </SettingsContent>
      */}
      </div>
    );
  }
}
