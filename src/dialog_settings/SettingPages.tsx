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
import { SettingPageSecurity } from './SettingPageSecurity';
import { SettingPageLanguage } from './SettingPageLanguage';
import { SettingsDialogContext, SettingsDialogProvider } from './StoreProvider';
import { MenuItemProps } from './MenuItem';

export interface SettingsProps {
  items: MenuItemProps[];
}

export const SettingPages = (props: SettingsProps) => {
  const [settingsDialogState, dispatch]: SettingsDialogProvider = React.useContext(
    SettingsDialogContext
  );
  let ActivePage;
  const pages = props.items.map((item, index) => {
    let Page;
    if (item.id === 'save') {
      Page = <SettingPageSave item={item} index={index} />;
    }
    else if (item.id === 'security') {
      Page = <SettingPageSecurity item={item} index={index} />;
    }
    else if (item.id === 'language') {
      Page = <SettingPageLanguage item={item} index={index} />;
    }

    if (settingsDialogState.activeSettingId === item.id) {
      ActivePage = Page;
    }
    else {
      return Page;
    }
  });
  return (
    <div styleName='settingPages'>
      {ActivePage}
      {pages}
    </div>
  );
};
