/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { GlobalContext, GlobalProvider } from './StoreProvider';
import './SettingPageSave.css';
import { MenuItemProps } from './MenuItem';
import { SettingPageTemplate } from './SettingPageTemplate';

export interface SettingPageSaveProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageSave = (props: SettingPageSaveProps) => {
  const [globalState] = React.useContext(GlobalContext) as GlobalProvider;

  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{globalState.messages.saveDetailedText}</p>
      <input type='radio' styleName='locationSelector' checked />
      <div styleName='saveFilePath'>
        {globalState.messages.saveFilePath}: {globalState.cardDir}
      </div>
      <button styleName='saveChangeFilePathButton'>
        {globalState.messages.saveChangeFilePathButton}
      </button>
    </SettingPageTemplate>
  );
};
