/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { getCurrentDateAndTime } from './utils';
import { darkenHexColor, cardColors } from './color';
// Dragging is shaky when _DRAG_IMAGE_MARGIN is too small, especially just after loading a card.
//  private _DRAG_IMAGE_MARGIN = 20;
export const DRAG_IMAGE_MARGIN = 50;

export type Geometry = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
};
export type CardBase = {
  id: string;
  data: string;
};
export type CardStyle = {
  uiColor: string;
  backgroundColor: string;
  opacity: number;
  zoom: number;
};
export type CardDate = {
  createdDate: string;
  modifiedDate: string;
};
// Properties of a card that must be serialized
// Each of them must have unique name to be able to use as a key when serialize.
export type CardPropSerializable = CardBase & Geometry & CardStyle & CardDate;

export type CardStatus = 'Focused' | 'Blurred';

export const DEFAULT_CARD_GEOMETRY: Geometry = {
  x: 70,
  y: 70,
  z: 0,
  width: 260,
  height: 176,
};
export const DEFAULT_CARD_STYLE: CardStyle = {
  uiColor: '',
  backgroundColor: cardColors.yellow,
  opacity: 1.0,
  zoom: 1.0,
};
DEFAULT_CARD_STYLE.uiColor = darkenHexColor(DEFAULT_CARD_STYLE.backgroundColor);

export class CardProp implements CardBase {
  public id = '';
  public data = '';
  public geometry: Geometry = DEFAULT_CARD_GEOMETRY;
  public style: CardStyle = DEFAULT_CARD_STYLE;
  public date: CardDate = {
    createdDate: getCurrentDateAndTime(),
    modifiedDate: getCurrentDateAndTime(),
  };

  public status: CardStatus = 'Blurred';
  // eslint-disable-next-line complexity
  constructor (
    _id?: string,
    _data?: string,
    _geometry?: Geometry,
    _style?: CardStyle,
    _date?: CardDate
  ) {
    if (_id !== undefined) {
      this.id = _id;
    }

    if (_data !== undefined) {
      this.data = _data;
    }

    if (
      _geometry !== undefined &&
      _geometry.x !== undefined &&
      _geometry.y !== undefined &&
      _geometry.z !== undefined
    ) {
      this.geometry = _geometry;
    }
    this.geometry.x = Math.round(this.geometry.x);
    this.geometry.y = Math.round(this.geometry.y);
    this.geometry.z = Math.round(this.geometry.z);
    this.geometry.width = Math.round(this.geometry.width);
    this.geometry.height = Math.round(this.geometry.height);

    if (
      _style !== undefined &&
      _style.backgroundColor !== undefined &&
      _style.opacity !== undefined &&
      _style.uiColor !== undefined &&
      _style.zoom !== undefined
    ) {
      this.style = _style;
    }

    if (
      _date !== undefined &&
      _date.createdDate !== undefined &&
      _date.modifiedDate !== undefined
    ) {
      this.date = _date;
    }
  }

  static getPlainText = (data: string) => {
    if (data === '') {
      return '';
    }

    // Replace alt attributes
    data = data.replace(/<[^>]+?alt=["'](.+?)["'][^>]+?>/g, '$1');

    return data.replace(/<[^>]+?>/g, '').substr(0, 30);
  };

  public toObject = (): CardPropSerializable => {
    return {
      id: this.id,
      data: this.data,
      x: this.geometry.x,
      y: this.geometry.y,
      z: this.geometry.z,
      width: this.geometry.width,
      height: this.geometry.height,
      uiColor: this.style.uiColor,
      backgroundColor: this.style.backgroundColor,
      opacity: this.style.opacity,
      zoom: this.style.zoom,
      createdDate: this.date.createdDate,
      modifiedDate: this.date.modifiedDate,
    };
  };

  public static fromObject = (json: CardPropSerializable): CardProp => {
    return new CardProp(
      json.id,
      json.data,
      { x: json.x, y: json.y, z: json.z, width: json.width, height: json.height },
      {
        uiColor: json.uiColor,
        backgroundColor: json.backgroundColor,
        opacity: json.opacity,
        zoom: json.zoom,
      },
      {
        createdDate: json.createdDate,
        modifiedDate: json.modifiedDate,
      }
    );
  };
}
