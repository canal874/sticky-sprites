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
import { setMessageContext } from './StoreProvider';
import { Messages } from '../modules_common/i18n';

const onready = () => {
  const domContainer = document.getElementById('react-container');

  ipcRenderer
    .invoke('get-i18n')
    .then((result: Messages) => {
      setMessageContext(result);
      render();
    })
    .catch(() => {});

  const render = () => {
    const props: SettingsDialogProps = {
      defaultSettingName: 'SettingPageSave',
      menu: {
        title: 'SettingsDialog',
        items: [
          {
            name: 'SettingPageSave',
            color: 'yellow',
          },
          {
            name: 'SettingPageSecurity',
            color: 'purple',
          },
          {
            name: 'SettingPageLanguage',
            color: 'orange',
          },
        ],
      },
    };
    ReactDOM.render(React.createElement(SettingsDialog, props), domContainer);
  };
};

window.document.addEventListener('DOMContentLoaded', onready);
