/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { CardProp } from './cardprop';

export interface ICardIO {
  getCardIdList(): Promise<string[]>;
  readCardData(id: string): Promise<CardProp>;
  writeOrCreateCardData(prop: CardProp): Promise<string>;
  deleteCardData(id: string): Promise<string>;
}

export interface ICardEditor {
  readonly editorType: EditorType;
  readonly hasCodeMode: boolean;
  isOpened: boolean;

  loadUI(cardCssStyle: CardCssStyle): Promise<void>; // A Promise resolves when required initialization is finished.
  setCard(prop: CardProp): void; // Loading a card after loadUI().

  showEditor(): Promise<void>;
  hideEditor(): void;

  startEdit(): void;
  endEdit(): [boolean, string];
  toggleCodeMode(): void;
  startCodeMode(): void;
  endCodeMode(): void;

  setZoom(): void;
  setSize(width?: number, height?: number): void;
  setColor(): void;
}

export type CardCssStyle = {
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  border: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};

export type EditorType = 'WYSIWYG' | 'Markup';

export type ContentsFrameCommand =
  | 'overwrite-iframe'
  | 'click-parent'
  | 'contents-frame-loaded';

export type ContentsFrameMessage = {
  command: ContentsFrameCommand;
  arg: string;
};
export type InnerClickEvent = {
  x: number;
  y: number;
};

export const DialogButton = {
  Error: -1,
  Default: 0,
  Cancel: 1,
};
