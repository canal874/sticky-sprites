/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { MenuItem } from './MenuItem';

export interface MenuListProps {
  title: string;
  defaultItem: string;
  items: string[];
}

interface MenuListState {
  activeItem: string;
}

export class MenuList extends React.Component<MenuListProps, MenuListState> {
  constructor (props: MenuListProps) {
    super(props);
    this.state = {
      activeItem: this.props.defaultItem,
    };
  }

  handleClick = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({ activeItem: e.currentTarget.id || '' });
  };

  render = () => {
    return (
      <div className='settingMenu'>
        <h1>{this.props.title}</h1>
        {this.props.items.map(item => (
          <MenuItem
            key={item}
            id={item}
            activeItem={this.state.activeItem}
            onClick={this.handleClick}
          />
        ))}
      </div>
    );
  };
}
