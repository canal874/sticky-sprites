/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { MenuItem, MenuItemProps } from './MenuItem';
import './MenuList.css';
import { MessageContext } from './StoreProvider';
import { MessageLabel } from '../modules_common/i18n';

export interface MenuListProps {
  title: MessageLabel;
  items: MenuItemProps[];
}

export const MenuList = (props: MenuListProps) => {
  const MESSAGE = React.useContext(MessageContext);
  return (
    <div styleName='menuList'>
      <h1 styleName='menuListTitle'>{MESSAGE(props.title)}</h1>
      {props.items.map(item => (
        <MenuItem key={item.id} id={item.id} label={item.label} color={item.color} />
      ))}
    </div>
  );
};
