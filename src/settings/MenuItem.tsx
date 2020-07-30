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
  DispatchContext,
  DispatchProvider,
  MessageContext,
  SettingsDialogAction,
} from './StoreProvider';

interface MenuItemProps {
  id: string;
  color: ColorName;
}

export const MenuItem = (props: MenuItemProps) => {
  const MESSAGE = React.useContext(MessageContext);

  const style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
  });

  const [state, dispatch]: DispatchProvider = React.useContext(DispatchContext);

  const handleClick = () => {
    const action: SettingsDialogAction = {
      payload: { activeSettingName: props.id },
    };
    dispatch(action);
  };

  return (
    <h2
      id={props.id}
      styleName={`menuItem ${
        state.activeSettingName === props.id ? 'activeItem' : 'inactiveItem'
      }`}
      onClick={handleClick}
      style={style(props.color)}
    >
      {MESSAGE(props.id)}
    </h2>
  );
};
