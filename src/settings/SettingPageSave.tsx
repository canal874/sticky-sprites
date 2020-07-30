/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';

export interface SettingPageSaveProps {
  title: string;
}

export class SettingPageSave extends React.Component<SettingPageSaveProps> {
  render = () => {
    return (
      <div>
        <h3>{this.props.title}</h3>
        <p>Save Settings</p>
      </div>
    );
  };
}
