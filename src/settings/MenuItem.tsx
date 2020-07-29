/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './MenuItem.css';

interface MenuItemProps {
  id: string;
  activeItem: string;
  color: string;
  onClick: (event: React.MouseEvent<HTMLHeadingElement, MouseEvent>) => void;
}

export class MenuItem extends React.Component<MenuItemProps> {
  render () {
    return (
      <h2
        id={this.props.id}
        styleName={`menuItem ${
          this.props.activeItem === this.props.id ? 'activeItem' : 'inactiveItem'
        } ${this.props.color}`}
        onClick={this.props.onClick}
      >
        {this.props.id}
      </h2>
    );
  }
}
