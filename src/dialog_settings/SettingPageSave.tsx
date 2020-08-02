/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import {
  AppSettingsContext,
  AppSettingsProvider,
  MessageContext,
  SettingsDialogContext,
  SettingsDialogProvider,
} from './StoreProvider';
import './SettingPageSave.css';
import { cardColors, ColorName } from '../modules_common/color';
import { MenuItemProps } from './MenuItem';

export interface SettingPageSaveProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageSave = (props: SettingPageSaveProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;

  const [settingsDialogState, dispatch]: SettingsDialogProvider = React.useContext(
    SettingsDialogContext
  );
  const [appSettingsState, appSettingsDispatch]: AppSettingsProvider = React.useContext(
    AppSettingsContext
  );
  const style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
    zIndex: settingsDialogState.activeSettingId === props.item.id ? 200 : 150 - props.index,
  });

  return (
    <div
      style={style(props.item.color)}
      styleName='settingPageSave'
      className={`${
        settingsDialogState.activeSettingId === props.item.id ? 'activePage' : ''
      } ${
        settingsDialogState.previousActiveSettingId === props.item.id
          ? 'previousActivePage'
          : ''
      } ${
        settingsDialogState.activeSettingId !== props.item.id &&
        settingsDialogState.previousActiveSettingId !== props.item.id
          ? 'inactivePage'
          : ''
      }`}
    >
      <p>{MESSAGE('saveDetailedText')}</p>
      <input type='radio' styleName='locationSelector' checked />
      <div styleName='saveFilePath'>
        {MESSAGE('saveFilePath')}: {appSettingsState.settings.cardDir}
      </div>
      <button styleName='saveChangeFilePathButton'>
        {MESSAGE('saveChangeFilePathButton')}
      </button>
    </div>
  );
};