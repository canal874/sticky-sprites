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
  MessageContext,
  SettingsDialogAction,
  SettingsDialogContext,
  SettingsDialogProvider,
} from './StoreProvider';
import { MessageLabel } from '../modules_common/i18n';

export interface MenuItemProps {
  id: string;
  label: MessageLabel;
  color: ColorName;
}

export interface MenuItemPropsInternal {
  index: number;
}

export const MenuItem = (props: MenuItemProps & MenuItemPropsInternal) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;
  const [state, dispatch]: SettingsDialogProvider = React.useContext(SettingsDialogContext);

  const isActive = state.activeSettingId === props.id;
  const isPrevActive = state.previousActiveSettingId === props.id;

  const menuHeight = 50;
  const style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
    zIndex: isActive ? 190 : props.index,
  });

  const handleClick = () => {
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
      {MESSAGE(props.label)}
    </h2>
  );
};
