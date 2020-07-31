/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import { SettingsDialog, SettingsDialogProps } from './SettingsDialog';
import { Messages } from '../modules_common/i18n';
import { Settings } from '../modules_common/settings';

const onready = () => {
  const domContainer = document.getElementById('react-container');

  const props: SettingsDialogProps = {
    defaultSettingId: 'save',
    menu: {
      title: 'settingsDialog',
      items: [
        {
          id: 'save',
          label: 'settingPageSave',
          color: 'yellow',
        },
        {
          id: 'security',
          label: 'settingPageSecurity',
          color: 'purple',
        },
        {
          id: 'language',
          label: 'settingPageLanguage',
          color: 'orange',
        },
      ],
    },
  };
  ReactDOM.render(React.createElement(SettingsDialog, props), domContainer);
};

window.document.addEventListener('DOMContentLoaded', onready);
