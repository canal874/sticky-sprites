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
  document.getElementById('title')!.style.width =
    cardProp.geometry.width - cardCssStyle.border.left - cardCssStyle.border.right + 'px';
  const closeBtnLeft =
    cardProp.geometry.width -
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

const renderContentsRect = () => {
  // width of BrowserWindow (namely cardProp.geometry.width) equals border + padding + content.
  document.getElementById('contents')!.style.width =
    cardProp.geometry.width -
    cardCssStyle.border.left -
    cardCssStyle.border.right -
    cardCssStyle.padding.left -
    cardCssStyle.padding.right +
    'px';

  document.getElementById('contents')!.style.height =
    cardProp.geometry.height -
    cardCssStyle.border.top -
    cardCssStyle.border.bottom -
    document.getElementById('titleBar')!.offsetHeight -
    cardCssStyle.padding.top -
    cardCssStyle.padding.bottom +
    'px';
};

const renderCardStyle = () => {
  if (cardProp.status === 'Focused') {
    document.getElementById('card')!.style.border = '3px solid red';
  }
  else if (cardProp.status === 'Blurred') {
    document.getElementById('card')!.style.border = '3px solid transparent';
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
  // document.getElementById('contents')!.style.backgroundColor = backgroundRgba;
  const darkerRgba = convertHexColorToRgba(
    darkenHexColor(cardProp.style.backgroundColor),
    cardProp.style.opacity
  );
  document.getElementById(
    'contents'
  )!.style.background = `linear-gradient(135deg, ${backgroundRgba} 94%, ${darkerRgba})`;

  const uiRgba = convertHexColorToRgba(cardProp.style.uiColor);

  document.getElementById('title')!.style.backgroundColor = uiRgba;

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
      renderContentsRect();
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
