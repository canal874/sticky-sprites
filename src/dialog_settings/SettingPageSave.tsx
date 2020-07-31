/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { ipcRenderer } from 'electron';
import { MessageContext } from './StoreProvider';
import { Settings } from '../modules_common/settings';
import './SettingPageSave.css';

export interface SettingPageSaveProps {}

export const SettingPageSave = (props: SettingPageSaveProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;

  return (
    <div styleName='settingPageSave'>
      <p>{MESSAGE('saveDetailedText')}</p>
      <input type='radio' styleName='locationSelector' checked />
      <div styleName='saveFilePath'>{MESSAGE('saveFilePath')}</div>
      <button styleName='saveChangeFilePathButton'>
        {MESSAGE('saveChangeFilePathButton')}
      </button>
    </div>
  );
};
