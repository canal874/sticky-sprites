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

interface MenuItemProps {
  id: string;
  activeItem: string;
  color: ColorName;
  onClick: (event: React.MouseEvent<HTMLHeadingElement, MouseEvent>) => void;
}

export class MenuItem extends React.Component<MenuItemProps> {
  style = (color: ColorName) => ({
    backgroundColor: cardColors[color],
  });

  render () {
    return (
      <h2
        id={this.props.id}
        styleName={`menuItem ${
          this.props.activeItem === this.props.id ? 'activeItem' : 'inactiveItem'
        }`}
        onClick={this.props.onClick}
        style={this.style(this.props.color)}
      >
        {this.props.id}
      </h2>
    );
  }
}
