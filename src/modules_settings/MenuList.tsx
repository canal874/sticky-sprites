/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import React from 'react';

interface MenuItemProps {
  item: string;
  activeItem: string;
}

export interface MenuListProps {
  title: string;
  defaultItem: string;
  items: string[];
}

interface MenuListState {
  activeItem: string;
}

class MenuItem extends React.Component<MenuItemProps> {
  render () {
    return (
      <h2
        id={this.props.item}
        className={`menuItem ${
          this.props.activeItem === this.props.item ? 'activeItem' : ''
        }`}
      >
        {this.props.item}
      </h2>
    );
  }
}

export class MenuList extends React.Component<MenuListProps, MenuListState> {
  state: MenuListState = {
    activeItem: this.props.defaultItem,
  };

  render () {
    return (
      <div className='settingMenu'>
        <h1>{this.props.title}</h1>
        {this.props.items.map(item => (
          <MenuItem key={item} item={item} activeItem={this.state.activeItem} />
        ))}
      </div>
    );
  }
}
