/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { CardProp } from './modules_common/card';
import { CardCssStyle, ICardEditor } from './modules_common/types';
import { convertHexColorToRgba } from './modules_common/utils';

let cardProp: CardProp;
let cardCssStyle: CardCssStyle;
let cardEditor: ICardEditor;

let renderOffsetHeight: number = 0; // Offset of card height from actual window height;
let renderOffsetWidth: number = 0; // Offset of card height from actual window width;

export const getRenderOffsetWidth = () => {
  return renderOffsetWidth;
};
export const setRenderOffsetWidth = (w: number) => {
  renderOffsetWidth = w;
};
export const getRenderOffsetHeight = () => {
  return renderOffsetHeight;
};
export const setRenderOffsetHeight = (h: number) => {
  renderOffsetHeight = h;
};

export const initCardRenderer = (
  prop: CardProp,
  style: CardCssStyle,
  editor: ICardEditor
) => {
  cardProp = prop;
  cardCssStyle = style;
  cardEditor = editor;
};

export enum CardRenderOptions {
  All,
  Color,
  TitleBar,
  ContentsData,
  ContentsSize,
  EditorColor,
  EditorSize,
}

const renderTitleBar = () => {
  const closeBtnLeft =
    cardProp.rect.width -
    cardCssStyle.border.left -
    cardCssStyle.border.right -
    document.getElementById('closeBtn')!.offsetWidth;
  document.getElementById('closeBtn')!.style.left = closeBtnLeft + 'px';
  const titleBarLeft =
    document.getElementById('codeBtn')!.offsetLeft +
    document.getElementById('codeBtn')!.offsetWidth;
  const barwidth = closeBtnLeft - titleBarLeft;
  document.getElementById('titleBar')!.style.left = titleBarLeft + 'px';
  document.getElementById('titleBar')!.style.width = barwidth + 'px';
};

const renderContentsData = () => {
  document.getElementById('contents')!.innerHTML = cardProp.data;
};

const renderContentsSize = () => {
  // width of BrowserWindow (namely cardProp.rect.width) equals border + padding + content.
  document.getElementById('contents')!.style.width =
    cardProp.rect.width -
    cardCssStyle.border.left -
    cardCssStyle.border.right -
    cardCssStyle.padding.left -
    cardCssStyle.padding.right +
    'px';

  document.getElementById('contents')!.style.height =
    cardProp.rect.height -
    cardCssStyle.border.top -
    cardCssStyle.border.bottom -
    document.getElementById('titleBar')!.offsetHeight -
    cardCssStyle.padding.top -
    cardCssStyle.padding.bottom +
    'px';
};

const setCardColor = () => {
  // Set card properties
  let backgroundRgba = convertHexColorToRgba(
    cardProp.style.backgroundColor,
    cardProp.style.backgroundOpacity
  );
  document.getElementById('contents')!.style.backgroundColor = backgroundRgba;

  let titleRgba = convertHexColorToRgba(
    cardProp.style.titleColor,
    cardProp.style.backgroundOpacity,
    0.8
  );
  Array.from(document.getElementsByClassName('title-color')).forEach(node => {
    (node as HTMLElement).style.backgroundColor = titleRgba;
  });
};

const setEditorColor = () => {
  let backgroundRgba = convertHexColorToRgba(
    cardProp.style.backgroundColor,
    cardProp.style.backgroundOpacity
  );
  let darkerRgba = convertHexColorToRgba(
    cardProp.style.titleColor,
    cardProp.style.backgroundOpacity,
    0.8
  );
  cardEditor.setColor(backgroundRgba, darkerRgba);
};

const renderEditorSize = () => {
  cardEditor.setSize();
};

export const render = (
  options: CardRenderOptions[] = [CardRenderOptions.All]
) => {
  for (let opt of options) {
    if (opt == CardRenderOptions.Color || opt == CardRenderOptions.All)
      setCardColor();
    if (opt == CardRenderOptions.TitleBar || opt == CardRenderOptions.All)
      renderTitleBar();
    if (opt == CardRenderOptions.ContentsData || opt == CardRenderOptions.All)
      renderContentsData();
    if (opt == CardRenderOptions.ContentsSize || opt == CardRenderOptions.All)
      renderContentsSize();
    if (opt == CardRenderOptions.EditorColor || opt == CardRenderOptions.All)
      setEditorColor();
    if (opt == CardRenderOptions.EditorSize || opt == CardRenderOptions.All)
      renderEditorSize();
  }
};
