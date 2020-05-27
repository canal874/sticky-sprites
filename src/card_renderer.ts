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

export type CardRenderOptions =
  | 'All'
  | 'Color'
  | 'TitleBar'
  | 'ContentsData'
  | 'ContentsSize'
  | 'EditorColor'
  | 'EditorSize';

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

const renderCardDecorator = () => {
  if (cardProp.status == 'Focused') {
    document.getElementById('card')!.style.border = '3px solid red';
  }
  else if (cardProp.status == 'Blured') {
    document.getElementById('card')!.style.border = '3px solid transparent';
  }

  let titleOpacity = cardProp.style.backgroundOpacity;

  document.getElementById('title')!.style.visibility = 'visible';
  if (cardProp.style.backgroundOpacity == 0) {
    if (cardProp.status == 'Focused') {
      titleOpacity = 1.0;
    }
    else if (cardProp.status == 'Blured') {
      document.getElementById('title')!.style.visibility = 'hidden';
      titleOpacity = 1.0;
    }
  }

  // Set card properties
  let backgroundRgba = convertHexColorToRgba(
    cardProp.style.backgroundColor,
    cardProp.style.backgroundOpacity
  );
  document.getElementById('contents')!.style.backgroundColor = backgroundRgba;

  let titleRgba = convertHexColorToRgba(
    cardProp.style.titleColor,
    titleOpacity,
    0.8
  );

  Array.from(document.getElementsByClassName('title-color')).forEach(node => {
    (node as HTMLElement).style.backgroundColor = titleRgba;
  });
};

const renderEditorColor = () => {
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

export const render = (options: CardRenderOptions[] = ['All']) => {
  for (let opt of options) {
    if (opt == 'TitleBar' || opt == 'All') renderTitleBar();
    if (opt == 'ContentsData' || opt == 'All') renderContentsData();
    if (opt == 'ContentsSize' || opt == 'All') renderContentsSize();
    if (opt == 'Color' || opt == 'All') renderCardDecorator();
    if (opt == 'EditorColor' || opt == 'All') renderEditorColor();
    if (opt == 'EditorSize' || opt == 'All') renderEditorSize();
  }
};
