/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { ipcRenderer } from 'electron';
import fs from 'fs-extra';
import { GlobalContext, GlobalProvider } from './StoreProvider';
import './SettingPageSave.css';
import { MenuItemProps } from './MenuItem';
import { SettingPageTemplate } from './SettingPageTemplate';
import { MessageLabel } from '../modules_common/i18n';
import { cardColors, ColorName } from '../modules_common/color';

export interface SettingPageSaveProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageSave = (props: SettingPageSaveProps) => {
  const [globalState] = React.useContext(GlobalContext) as GlobalProvider;
  const MESSAGE = (label: MessageLabel) => {
    return globalState.i18n.messages[label];
  };
  const onChangeButtonClick = async () => {
    const file = await ipcRenderer.invoke('open-directory-selector-dialog').catch(e => {
      console.error(`Failed to open directory selector dialog: ${e.me}`);
    });
    if (file) {
      await ipcRenderer.invoke('close-cardio').catch(e => {
        console.error(`Failed to close cardio: ${e.me}`);
      });

      console.debug(file);
      fs.copySync(globalState.cardDir, file[0]);
    }
  };
  const buttonStyle = (color: ColorName) => ({
    backgroundColor: cardColors[color],
  });
  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{MESSAGE('saveDetailedText')}</p>
      <input type='radio' styleName='locationSelector' checked />
      <div styleName='saveFilePath'>
        <div styleName='saveFilePathLabel'>{MESSAGE('saveFilePath')}:</div>
        <button
          styleName='saveChangeFilePathButton'
          onClick={onChangeButtonClick}
          style={buttonStyle('red')}
        >
          {MESSAGE('saveChangeFilePathButton')}
        </button>
        <div styleName='saveFilePathValue'>{globalState.cardDir}</div>
      </div>
    </SettingPageTemplate>
  );
};
