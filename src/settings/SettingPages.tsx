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
import { Store, StoreProvider } from './Store';

export interface SettingsProps {
  items: { name: string; color: ColorName }[];
}

export const SettingPages = (props: SettingsProps) => {
  const [state, dispatch]: StoreProvider = React.useContext(Store);

  const style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
  });

  const activeItem = props.items.find(item => item.name === state.activeSettingName);

  const color = activeItem ? activeItem.color : 'white';

  let activePage;

  if (state.activeSettingName === 'save') {
    activePage = <SettingPageSave title='save' />;
  }
  else if (state.activeSettingName === 'permission') {
    activePage = <SettingPagePermission title='permission' />;
  }
  else if (state.activeSettingName === 'language') {
    activePage = <SettingPageLanguage title='language' />;
  }

  return (
    <div styleName='settingPages' style={style(color)}>
      {activePage}
    </div>
  );
};
