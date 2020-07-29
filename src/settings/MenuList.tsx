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

export interface MenuListProps {
  title: string;
  items: { name: string; color: ColorName }[];
}

interface MenuListPropsInternal {
  activeItemName: string;
  onClick: (event: React.MouseEvent<HTMLHeadingElement, MouseEvent>) => void;
}

export class MenuList extends React.Component<MenuListProps & MenuListPropsInternal> {
  render = () => {
    return (
      <div styleName='menuList'>
        <h1>{this.props.title}</h1>
        {this.props.items.map(item => (
          <MenuItem
            key={item.name}
            id={item.name}
            activeItemName={this.props.activeItemName}
            color={item.color}
            onClick={this.props.onClick}
          />
        ))}
      </div>
    );
  };
}
