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

export interface SettingsDialogProps {
  menu: MenuListProps;
  defaultSettingName: string;
}

interface SettingsDialogState {
  activeSettingName: string;
}

export class SettingsDialog extends React.Component<
  SettingsDialogProps,
  SettingsDialogState
> {
  constructor (props: SettingsDialogProps) {
    super(props);
    this.state = {
      activeSettingName: this.props.defaultSettingName,
    };
  }

  handleClick = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({ activeSettingName: e.currentTarget.id || '' });
  };

  render () {
    return (
      <div styleName='settingsDialog'>
        <MenuList
          title={this.props.menu.title}
          items={this.props.menu.items}
          activeItemName={this.state.activeSettingName}
          onClick={this.handleClick}
        />
        <SettingPages
          items={this.props.menu.items}
          activeItemName={this.state.activeSettingName}
        />
      </div>
    );
  }
}
