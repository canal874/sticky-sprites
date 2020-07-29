/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingPages.css';

export interface SettingsProps {}

export class SettingPages extends React.Component<SettingsProps> {
  render = () => {
    return (
      <div styleName='settingPages'>
        Setting Pages
        {/*
        <SaveSettingPage title="save"></SaveSettingPage>
        <PermissionSettingPage title="permission"></PermissionSettingPage>
        <LanguageSettingPage title="language"></LanguageSettingPage>
      */}
      </div>
    );
  };
}
