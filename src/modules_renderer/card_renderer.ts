/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { CardProp } from '../modules_common/cardprop';
import { CardCssStyle, ICardEditor } from '../modules_common/types';
import { convertHexColorToRgba, darkenHexColor } from '../modules_common/color';
import window from './window';

let cardCssStyle: CardCssStyle;
let cardProp: CardProp;
let cardEditor: ICardEditor;

export const shadowHeight = 5;
export const shadowWidth = 5;
let renderOffsetHeight = 0; // Offset of card height from actual window height;
let renderOffsetWidth = 0; // Offset of card height from actual window width;

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
  | 'TitleBar'
  | 'TitleBarStyle'
  | 'CardStyle'
  | 'ContentsData'
  | 'ContentsRect'
  | 'EditorStyle'
  | 'EditorRect';

const setWindowTitle = () => {
  window.api.setTitle(cardProp.id, CardProp.getPlainText(cardProp.data));
};

const renderTitleBar = () => {
  const titleWidth = cardProp.geometry.width - cardCssStyle.borderWidth * 2 - shadowWidth;
  document.getElementById('title')!.style.width = titleWidth + 'px';
  const closeBtnLeft = titleWidth - document.getElementById('closeBtn')!.offsetWidth;
  document.getElementById('closeBtn')!.style.left = closeBtnLeft + 'px';
  const titleBarLeft =
    document.getElementById('codeBtn')!.offsetLeft +
    document.getElementById('codeBtn')!.offsetWidth;
  const barwidth = closeBtnLeft - titleBarLeft;
  document.getElementById('titleBar')!.style.left = titleBarLeft + 'px';
  document.getElementById('titleBar')!.style.width = barwidth + 'px';

  if (cardEditor.isOpened) {
    document.getElementById('codeBtn')!.style.visibility = 'visible';
  }
  else {
    document.getElementById('codeBtn')!.style.visibility = 'hidden';
  }
  /**
   * TODO: Update title when cardProp.data changes
   */
  setWindowTitle();
};

const renderTitleBarStyle = () => {
  const darkerColor = darkenHexColor(cardProp.style.backgroundColor, 0.6);
  document.getElementById('newBtn')!.style.color = darkerColor;
  document.getElementById('closeBtn')!.style.color = darkerColor;

  if (cardEditor.isCodeMode) {
    document.getElementById('codeBtn')!.style.color = '#ff0000';
  }
  else {
    document.getElementById('codeBtn')!.style.color = darkerColor;
  }
};

const renderContentsData = () => {
  return new Promise((resolve, reject) => {
    //    console.debug('renderContentsData');

    // Script and CSS loaded from contents_frame.html are remained after document.write().
    const html = `<!DOCTYPE html>
  <html>
    <head>
      <link href='./css/ckeditor-media-stickies-contents.css' type='text/css' rel='stylesheet' />
      <script> var exports = {}; </script>
      <script type='text/javascript' src='./iframe/contents_frame.js'></script>
    </head>
    <body>
      ${cardProp.data}
    </body>
  </html>`;
    try {
      const iframe = document.getElementById('contentsFrame') as HTMLIFrameElement;
      iframe.contentWindow!.document.write(html);
      iframe.contentWindow!.document.close();
      const checkLoading = () => {
        iframe.removeEventListener('load', checkLoading);
        resolve();
      };
      iframe.addEventListener('load', checkLoading);
    } catch (e) {
      reject(e);
    }
  });
};

const renderCardAndContentsRect = () => {
  // cardOffset is adjustment for box-shadow
  let cardOffset = 0;
  if (cardProp.status === 'Blurred') {
    cardOffset = cardCssStyle.borderWidth;
  }
  const cardWidth =
    cardProp.geometry.width - cardOffset - shadowWidth + getRenderOffsetWidth();

  const cardHeight =
    cardProp.geometry.height - cardOffset - shadowHeight + getRenderOffsetHeight();

  document.getElementById('card')!.style.width = cardWidth + 'px';
  document.getElementById('card')!.style.height = cardHeight + 'px';

  // width of BrowserWindow (namely cardProp.geometry.width) equals border + padding + content.
  const contentsWidth =
    cardProp.geometry.width +
    renderOffsetWidth -
    cardCssStyle.borderWidth * 2 -
    shadowWidth;

  const contentsHeight =
    cardProp.geometry.height +
    renderOffsetHeight -
    cardCssStyle.borderWidth * 2 -
    document.getElementById('title')!.offsetHeight -
    shadowHeight;

  document.getElementById('contents')!.style.width = contentsWidth + 'px';
  document.getElementById('contents')!.style.height = contentsHeight + 'px';

  document.getElementById('resizeAreaRight')!.style.top = '0px';
  document.getElementById('resizeAreaRight')!.style.left =
    cardWidth - cardCssStyle.borderWidth + 'px';
  document.getElementById('resizeAreaRight')!.style.width = shadowWidth + 'px';
  document.getElementById('resizeAreaRight')!.style.height =
    cardHeight + cardCssStyle.borderWidth + 'px';

  document.getElementById('resizeAreaBottom')!.style.top =
    cardHeight - cardCssStyle.borderWidth + 'px';
  document.getElementById('resizeAreaBottom')!.style.left = '0px';
  document.getElementById('resizeAreaBottom')!.style.width =
    cardWidth + cardCssStyle.borderWidth + 'px';
  document.getElementById('resizeAreaBottom')!.style.height = shadowHeight + 'px';

  document.getElementById('resizeAreaRightBottom')!.style.top =
    cardHeight - cardCssStyle.borderWidth + 'px';
  document.getElementById('resizeAreaRightBottom')!.style.left =
    cardWidth - cardCssStyle.borderWidth + 'px';
  document.getElementById('resizeAreaRightBottom')!.style.width = shadowWidth + 'px';
  document.getElementById('resizeAreaRightBottom')!.style.height = shadowHeight + 'px';
};

const renderCardStyle = () => {
  if (cardProp.status === 'Focused') {
    document.getElementById(
      'card'
    )!.style.border = `${cardCssStyle.borderWidth}px solid red`;
  }
  else if (cardProp.status === 'Blurred') {
    document.getElementById(
      'card'
    )!.style.border = `${cardCssStyle.borderWidth}px solid transparent`;
  }

  document.getElementById('title')!.style.visibility = 'visible';
  if (cardProp.style.opacity === 0 && cardProp.status === 'Blurred') {
    document.getElementById('title')!.style.visibility = 'hidden';
  }

  // Set card properties
  const backgroundRgba = convertHexColorToRgba(
    cardProp.style.backgroundColor,
    cardProp.style.opacity
  );
  document.getElementById('contents')!.style.backgroundColor = backgroundRgba;
  const darkerRgba = convertHexColorToRgba(
    darkenHexColor(cardProp.style.backgroundColor),
    cardProp.style.opacity
  );

  const uiRgba = convertHexColorToRgba(cardProp.style.uiColor);

  document.getElementById('title')!.style.backgroundColor = uiRgba;

  let boxShadow = 'none';
  if (cardProp.style.opacity !== 0 || cardProp.status === 'Focused') {
    boxShadow = '5px 5px 3px 0px rgba(0,0,0, .2)';
  }
  document.getElementById('card')!.style.boxShadow = boxShadow;

  // eslint-disable-next-line no-useless-catch
  try {
    const iframeDoc = (document.getElementById('contentsFrame') as HTMLIFrameElement)
      .contentDocument;
    if (iframeDoc) {
      const style = iframeDoc.createElement('style');
      style.innerHTML =
        'body::-webkit-scrollbar { width: 7px; background-color: ' +
        backgroundRgba +
        '}\n' +
        'body::-webkit-scrollbar-thumb { background-color: ' +
        uiRgba +
        '}';
      iframeDoc.head.appendChild(style);

      iframeDoc.body.style.zoom = `${cardProp.style.zoom}`;
    }
  } catch (e) {
    console.error(e);
  }
};

const renderEditorStyle = () => {
  cardEditor.setColor();
  cardEditor.setZoom();
};

const renderEditorRect = () => {
  cardEditor.setSize();
};

export const setTitleMessage = (msg: string) => {
  if (document.getElementById('titleMessage')) {
    document.getElementById('titleMessage')!.innerHTML = msg;
  }
};

export const render = async (
  options: CardRenderOptions[] = [
    'TitleBar',
    'TitleBarStyle',
    'ContentsData',
    'ContentsRect',
    'CardStyle',
    'EditorStyle',
    'EditorRect',
  ]
) => {
  /**
   * NOTE: CardStyle depends on completion of ContentsData
   */
  if (options.includes('ContentsData')) {
    options = options.filter(opt => opt !== 'ContentsData');
    await renderContentsData().catch(e =>
      console.error('Error in renderContentsData: ' + e)
    );
  }

  for (const opt of options) {
    if (opt === 'TitleBar') {
      renderTitleBar();
    }
    else if (opt === 'TitleBarStyle') {
      renderTitleBarStyle();
    }
    else if (opt === 'ContentsRect') {
      renderCardAndContentsRect();
    }
    else if (opt === 'CardStyle') {
      renderCardStyle();
    }
    else if (opt === 'EditorStyle') {
      renderEditorStyle();
    }
    else if (opt === 'EditorRect') {
      renderEditorRect();
    }
  }
};
