/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

export class CardProp {
  constructor(
    public id: string,
    public data: string = '',
    public x: number = 70,
    public y: number = 70,
    public width: number = 260,
    public height: number = 176,
    public titleColor: string = '#d0d090',
    public bgColor: string = '#ffffa0',
    public bgOpacity: number = 1.0){}
};

export interface ICardIO {
  generateNewCardId(): string;
  getCardIdList(): Promise<Array<string>>;
  readCardData(id: string): Promise<CardProp>;
  writeOrCreateCardData(prop: CardProp): Promise<string>;
  deleteCardData(id: string): Promise<string>;
};

export interface ICardEditor {
  resizedByCode: boolean;
  isEditorReady: boolean;
  readonly hasCodeMode: boolean;
  startEditMode(): void;
  endEditMode(): void;
  toggleCodeMode(): void;
  startCodeMode(): void;
  endCodeMode(): void;
  setSize(width: number, height: number): void;
}
