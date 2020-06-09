/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { getCurrentDate } from './utils';

export type Rectangle = {
  x: number;
  y: number;
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
  cardOpacity: number;
};
export type CardDate = {
  createdDate: string;
  modifiedDate: string;
};
// Properties of a card that must be serialized
// Each of them must have unique name to be able to use as a key when serialize.
export type CardPropSerializable = CardBase & Rectangle & CardStyle & CardDate;

export type CardStatus = 'Focused' | 'Blurred';

export const DEFAULT_CARD_RECT: Rectangle = { x: 70, y: 70, width: 260, height: 176 };
export const DEFAULT_CARD_STYLE: CardStyle = {
  uiColor: '#cdcd80',
  backgroundColor: '#ffffa0',
  cardOpacity: 1.0,
};

export class CardProp implements CardBase {
  constructor (
    public id: string = '',
    public data: string = '',
    public rect: Rectangle = DEFAULT_CARD_RECT,
    public style: CardStyle = DEFAULT_CARD_STYLE,
    public date: CardDate = {
      createdDate: getCurrentDate(),
      modifiedDate: getCurrentDate(),
    },
    public status: CardStatus = 'Blurred'
  ) {}

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
      x: this.rect.x,
      y: this.rect.y,
      width: this.rect.width,
      height: this.rect.height,
      uiColor: this.style.uiColor,
      backgroundColor: this.style.backgroundColor,
      cardOpacity: this.style.cardOpacity,
      createdDate: this.date.createdDate,
      modifiedDate: this.date.modifiedDate,
    };
  };

  public static fromObject = (json: CardPropSerializable): CardProp => {
    return new CardProp(
      json.id,
      json.data,
      { x: json.x, y: json.y, width: json.width, height: json.height },
      {
        uiColor: json.uiColor,
        backgroundColor: json.backgroundColor,
        cardOpacity: json.cardOpacity,
      },
      {
        createdDate: json.createdDate,
        modifiedDate: json.modifiedDate,
      }
    );
  };
}
