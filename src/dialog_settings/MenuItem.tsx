/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './MenuItem.css';
import { cardColors, ColorName } from '../modules_common/color';
import {
  GlobalContext,
  SettingsDialogAction,
  SettingsDialogContext,
  SettingsDialogProvider,
} from './StoreProvider';
import { MessageLabel } from '../modules_common/i18n';
import { getRandomInt } from '../modules_common/utils';

export interface MenuItemProps {
  id: string;
  label: MessageLabel;
  color: ColorName;
  width: number;
  height: number;
}

export interface MenuItemPropsInternal {
  index: number;
}

export const MenuItem = (props: MenuItemProps & MenuItemPropsInternal) => {
  const globalState = React.useContext(GlobalContext);
  const [state, dispatch]: SettingsDialogProvider = React.useContext(SettingsDialogContext);

  const isActive = state.activeSettingId === props.id;
  const isPrevActive = state.previousActiveSettingId === props.id;

  const menuHeight = 50;
  const style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
    zIndex: isActive ? 190 : props.index,
  });

  let currentAudio: HTMLAudioElement;
  const handleClick = () => {
    // Play if page changes
    if (currentAudio !== undefined) {
      currentAudio.pause();
    }
    currentAudio = document.getElementById(
      'soundEffect0' + getRandomInt(1, 4)
    ) as HTMLAudioElement;
    currentAudio.play();

    const action: SettingsDialogAction = {
      activeSettingId: props.id,
    };
    dispatch(action);
  };

  return (
    <h2
      id={props.id}
      styleName={`menuItem ${
        isActive ? 'activeItem' : isPrevActive ? 'previousActiveItem' : 'inactiveItem'
      }`}
      onClick={isActive ? () => {} : handleClick}
      style={style(props.color)}
    >
      {globalState.MESSAGE(props.label)}
    </h2>
  );
};
