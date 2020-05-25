/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { getCurrentDate } from './utils';

export type Rectangle = {
  x: number,
  y: number,
  width: number,
  height: number
};
export type CardBase = {
  id: string,
  data: string
};
export type CardStyle = {
  titleColor: string,
  backgroundColor: string,
  backgroundOpacity: number
};
export type CardDate = {
  created_date: string,
  modified_date: string
}
// Properties of a card that must be serialized
// Each of them must have unique name to be able to use as a key when serialize.
export type CardPropSerializable = CardBase & Rectangle & CardStyle & CardDate;

export class CardProp implements CardBase {
  constructor(
    public id: string = '',
    public data: string = '',
    public rect: Rectangle = { x: 70, y: 70, width: 260, height: 176 },
    public style: CardStyle = { titleColor: '#d0d090', backgroundColor: '#ffffa0', backgroundOpacity: 1.0 },
    public date: CardDate = { created_date: getCurrentDate(), modified_date: getCurrentDate() }
  ) { }

  public toObject = (): CardPropSerializable => {
    return {
      id: this.id,
      data: this.data,
      x: this.rect.x,
      y: this.rect.y,
      width: this.rect.width,
      height: this.rect.height,
      titleColor: this.style.titleColor,
      backgroundColor: this.style.backgroundColor,
      backgroundOpacity: this.style.backgroundOpacity,
      created_date: this.date.created_date,
      modified_date: this.date.modified_date
    }
  };

  public static fromObject = (json: CardPropSerializable): CardProp => {
    return new CardProp(json.id, json.data,
      { x: json.x, y: json.y, width: json.width, height: json.height },
      { titleColor: json.titleColor, backgroundColor: json.backgroundColor, backgroundOpacity: json.backgroundOpacity },
      { created_date: json.created_date, modified_date: json.modified_date })
  }
};

