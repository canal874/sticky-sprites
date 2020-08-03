/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SettingsDialog, SettingsDialogProps } from './SettingsDialog';

const onready = () => {
  const domContainer = document.getElementById('react-container');

  const props: SettingsDialogProps = {
    defaultSettingId: 'save',
    title: 'settingsDialog',
    menu: {
      items: [
        {
          id: 'save',
          label: 'settingPageSave',
          color: 'yellow',
          width: 450,
          height: 220,
        },
        {
          id: 'security',
          label: 'settingPageSecurity',
          color: 'purple',
          width: 350,
          height: 220,
        },
        {
          id: 'language',
          label: 'settingPageLanguage',
          color: 'orange',
          width: 400,
          height: 220,
        },
      ],
    },
  };
  ReactDOM.render(React.createElement(SettingsDialog, props), domContainer);
};

window.document.addEventListener('DOMContentLoaded', onready);
