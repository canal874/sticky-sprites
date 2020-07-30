/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { MenuItem } from './MenuItem';
import './MenuList.css';
import { ColorName } from '../modules_common/color';
import { MessageContext } from './StoreProvider';

export interface MenuListProps {
  title: string;
  items: { name: string; color: ColorName }[];
}

export const MenuList = (props: MenuListProps) => {
  const MESSAGE = React.useContext(MessageContext);
  return (
    <div styleName='menuList'>
      <h1 styleName='menuListTitle'>{MESSAGE(props.title)}</h1>
      {props.items.map(item => (
        <MenuItem key={item.name} id={item.name} color={item.color} />
      ))}
    </div>
  );
};
