/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingPages.css';
import { cardColors, ColorName } from '../modules_common/color';
import { SettingPageSave } from './SettingPageSave';
import { SettingPagePermission } from './SettingPagePermission';
import { SettingPageLanguage } from './SettingPageLanguage';

export interface SettingsProps {
  activeItemName: string;
  items: { name: string; color: ColorName }[];
}

export class SettingPages extends React.Component<SettingsProps> {
  style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
  });

  render = () => {
    const activeItem = this.props.items.find(
      item => item.name === this.props.activeItemName
    );
    const color = activeItem ? activeItem.color : 'white';

    let activePage;
    if (this.props.activeItemName === 'save') {
      activePage = <SettingPageSave title='save' />;
    }
    else if (this.props.activeItemName === 'permission') {
      activePage = <SettingPagePermission title='permission' />;
    }
    else if (this.props.activeItemName === 'language') {
      activePage = <SettingPageLanguage title='language' />;
    }

    return (
      <div styleName='settingPages' style={this.style(color)}>
        {activePage}
      </div>
    );
  };
}
