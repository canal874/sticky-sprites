/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import uniqid from 'uniqid';
import { ipcRenderer } from 'electron';
import { CardProp } from '../modules_common/cardprop';
import { CardCssStyle, EditorType, ICardEditor } from '../modules_common/types';
import { MESSAGE, render, setRenderOffsetHeight } from '../modules_renderer/card_renderer';
import { alertDialog, getImageTag, logger, sleep } from '../modules_common/utils';
import { saveCard, saveCardColor } from '../modules_renderer/save';

export class CardEditor implements ICardEditor {
  /**
   * Private
   */
  private _ERROR_FAILED_TO_SET_DATA = 'Failed to set data.';

  private _codeMode = false;

  private _TOOLBAR_HEIGHT = 30;

  private _DRAG_IMAGE_MARGIN = 20;

  private _startEditorFirstTime = true;

  private _cardProp: CardProp = new CardProp('');

  private _cardCssStyle!: CardCssStyle; // cardCssStyle is set by loadUI()

  private _moveCursorToBottom = (): void => {
    const editor = CKEDITOR.instances.editor;
    const s = editor.getSelection(); // getting selection
    let selectedRanges = s.getRanges(); // getting ranges
    if (selectedRanges.length > 0) {
      let node = selectedRanges[0].startContainer; // selecting the starting node
      const parents = node.getParents(true);
      node = (parents[
        parents.length - 2
      ] as CKEDITOR.dom.element).getFirst() as CKEDITOR.dom.element;
      for (;;) {
        const x: CKEDITOR.dom.element = node.getNext() as CKEDITOR.dom.element;
        if (x == null) {
          break;
        }
        node = x;
      }

      s.selectElement(node);
      selectedRanges = s.getRanges();
      selectedRanges[0].collapse(false); //  false collapses the range to the end of the selected node, true before the node.
      s.selectRanges(selectedRanges); // putting the current selection there
    }
  };

  /**
   * Public
   */
  public editorType: EditorType = 'WYSIWYG'; // CKEditor should be WYSIWYG Editor Type
  // public editorType: EditorType = 'Markup'; // for testing Markup Editor Type

  public hasCodeMode = true;

  public isOpened = false;

  private _isEditing = false;

  adjustEditorSizeFromImage2Plugin = (width: number, height: number) => {
    // Cancel the resizing when the card contains anything other than an image.
    const body = CKEDITOR.instances.editor.document.getBody();
    if (body.$.childNodes.length >= 4) {
      return;
    }
    let count = 0;
    for (const elm of body.$.childNodes) {
      if (elm.nodeType === Node.ELEMENT_NODE) {
        if (!(elm as Element).getAttribute('data-cke-temp')) {
          count++;
        }
        if (count >= 3) {
          return;
        }
      }
    }
    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.visibility = 'hidden';
    }
    width =
      width +
      this._DRAG_IMAGE_MARGIN +
      this._cardCssStyle.border.left +
      this._cardCssStyle.border.right +
      this._cardCssStyle.padding.left +
      this._cardCssStyle.padding.right;
    height =
      height +
      this._DRAG_IMAGE_MARGIN +
      this._cardCssStyle.border.top +
      this._cardCssStyle.border.bottom +
      this._cardCssStyle.padding.top +
      this._cardCssStyle.padding.bottom +
      //      (this.isEditing ? this.TOOLBAR_HEIGHT : 0) +
      document.getElementById('titleBar')!.offsetHeight;

    if (width < 200) {
      /**
       * Toolbar has 2 lines when width is less than 200px.
       * Cancel the resizing because the bottom of the image will be obscured by the line.
       */
      return;
    }

    ipcRenderer.invoke('set-window-size', this._cardProp.id, width, height);

    this._cardProp.rect.width = width;
    this._cardProp.rect.height = height;

    render(['TitleBar', 'EditorRect']);
  };

  loadUI = (_cardCssStyle: CardCssStyle): Promise<void> => {
    this._cardCssStyle = _cardCssStyle;
    return new Promise<void>(resolve => {
      CKEDITOR.replace('editor');
      CKEDITOR.on('instanceReady', () => {
        // @ts-ignore
        CKEDITOR.plugins.image2.adjustEditorSize = this.adjustEditorSizeFromImage2Plugin;
        resolve();
        /*
         * Use timer for checking if instanceReady event is incredible
        const checkTimer = setInterval(() => {
          // Checking existence of 'cke_editor',
          // container, and .cke_inner
          if (
            document.getElementById('cke_editor') &&
            CKEDITOR.instances['editor'].container &&
            document.querySelector('.cke_inner')
          ) {
            clearInterval(checkTimer);
            resolve();
          }
        }, 200);
        */
      });
    });
  };

  setCard = (prop: CardProp): void => {
    this._cardProp = prop;
  };

  waitUntilActivationComplete = (): Promise<void> => {
    return new Promise(resolve => {
      const editor = CKEDITOR.instances.editor;
      const timer = setInterval(() => {
        const s = editor.getSelection();
        if (s) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  };

  private _imeWorkaround = async (): Promise<void> => {
    /**
     * This is workaround for Japanese IME & CKEditor on Windows.
     * IME window is unintentionally opened only at the first time of inputting Japanese.
     * Expected behavior is that IME always work inline on CKEditor.
     * A silly workaround is to blur and focus this browser window.
     */
    await ipcRenderer.invoke('blurAndFocus', this._cardProp.id);
  };

  private _setData = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        CKEDITOR.instances.editor.setData(this._cardProp.data, {
          callback: () => {
            // setData may be fail. Watch out.
            resolve();
          },
        });
      } catch (e) {
        reject(new Error(this._ERROR_FAILED_TO_SET_DATA));
      }
    });
  };

  private _addDragAndDropEvent = () => {
    //    CKEDITOR.instances['editor'].on('drop', async evt => {});
    // paste event is automatically occurred after drop.
    CKEDITOR.instances.editor.on('paste', evt => {
      const id = uniqid();
      const dataTransfer = evt.data.dataTransfer;
      if (dataTransfer.$.files) {
        const file = dataTransfer.$.files[0];
        if (file) {
          const dropImg = new Image();
          // eslint-disable-next-line unicorn/prefer-add-event-listener
          dropImg.onload = () => {
            const width = dropImg.naturalWidth;
            const height = dropImg.naturalHeight;

            let newImageWidth =
              this._cardProp.rect.width -
              this._DRAG_IMAGE_MARGIN -
              this._cardCssStyle.border.left -
              this._cardCssStyle.border.right -
              this._cardCssStyle.padding.left -
              this._cardCssStyle.padding.right;

            let newImageHeight = height;
            if (newImageWidth < width) {
              newImageHeight = (height * newImageWidth) / width;
            }
            else {
              newImageWidth = width;
            }

            newImageWidth = Math.floor(newImageWidth);
            newImageHeight = Math.floor(newImageHeight);

            const doc = CKEDITOR.instances.editor.document.$;
            const img = doc.getElementById(id);
            if (img) {
              img.setAttribute('width', `${newImageWidth}`);
              img.setAttribute('height', `${newImageHeight}`);
            }

            this._cardProp.rect.height =
              (this._cardProp.data === '' ? 0 : this._cardProp.rect.height) +
              newImageHeight +
              this._DRAG_IMAGE_MARGIN +
              this._TOOLBAR_HEIGHT +
              this._cardCssStyle.border.top +
              this._cardCssStyle.border.bottom +
              this._cardCssStyle.padding.top +
              this._cardCssStyle.padding.bottom +
              document.getElementById('titleBar')!.offsetHeight;

            ipcRenderer.invoke(
              'set-window-size',
              this._cardProp.id,
              this._cardProp.rect.width,
              this._cardProp.rect.height
            );

            this._cardProp.data = CKEDITOR.instances.editor.getData();
            render(['Decoration', 'EditorRect']);
            saveCard(this._cardProp);
          };
          const imgTag = getImageTag(id, file!.path, 1, 1);
          evt.data.dataValue = imgTag;
          if (this._cardProp.data === '') {
            saveCardColor(this._cardProp, '#ffffff', '#ffffff', 0.0);
            render();
          }

          dropImg.src = file.path;
        }
      }
    });
  };

  showEditor = async (): Promise<void> => {
    console.debug(`showEditor: ${this._cardProp.id}`);
    if (this.isOpened) {
      return;
    }

    render(['EditorRect']);

    const contents = document.getElementById('contents');
    if (contents) {
      contents.style.visibility = 'hidden';
    }
    const ckeEditor = document.getElementById('cke_editor');
    if (ckeEditor) {
      ckeEditor.style.visibility = 'visible';
      const toolbar = document.getElementById('cke_1_bottom');
      if (toolbar) {
        toolbar.style.visibility = 'hidden';
      }
    }
    else {
      throw new Error('cke_editor does not exist.');
    }

    let contCounter = 0;
    for (;;) {
      let cont = false;
      // eslint-disable-next-line no-loop-func, no-await-in-loop
      await this._setData().catch(async err => {
        if (err.message === this._ERROR_FAILED_TO_SET_DATA) {
          await sleep(1000);
          contCounter++;
          cont = true;
        }
        else {
          // logger.error does not work in ipcRenderer event.
          console.error(`Error in showEditor ${this._cardProp.id}: ${err.message}`);
          cont = false;
        }
      });
      if (contCounter >= 10) {
        cont = false;
        // logger.error does not work in ipcRenderer event.
        console.error(`Error in showEditor ${this._cardProp.id}: too many setData errors`);
        alertDialog(this._cardProp.id, MESSAGE.pleaseRestartErrorInOpeningCard);
      }
      if (cont) {
        console.debug(`re-trying setData for ${this._cardProp.id}`);
      }
      else {
        break;
      }
    }

    this._addDragAndDropEvent();

    this.isOpened = true;
  };

  hideEditor = () => {
    this.isOpened = false;
    document.getElementById('contents')!.style.visibility = 'visible';
    document.getElementById('cke_editor')!.style.visibility = 'hidden';
  };

  startEdit = async () => {
    this._isEditing = true;
    render(['EditorColor']);

    if (this._startEditorFirstTime) {
      this._startEditorFirstTime = false;
      await this._imeWorkaround();
    }
    // Expand card to add toolbar.
    const expandedHeight = this._cardProp.rect.height + this._TOOLBAR_HEIGHT;
    ipcRenderer.invoke(
      'set-window-size',
      this._cardProp.id,
      this._cardProp.rect.width,
      expandedHeight
    );
    setRenderOffsetHeight(-this._TOOLBAR_HEIGHT);

    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.visibility = 'visible';
    }

    await this.waitUntilActivationComplete();
    CKEDITOR.instances.editor.focus();
    if (this.editorType === 'Markup') {
      this._moveCursorToBottom();
    }
  };

  endEdit = (): [boolean, string] => {
    this._isEditing = false;

    let dataChanged = false;
    // Save data to CardProp
    const data = CKEDITOR.instances.editor.getData();
    if (this._cardProp.data !== data) {
      dataChanged = true;
    }

    ipcRenderer.invoke(
      'set-window-size',
      this._cardProp.id,
      this._cardProp.rect.width,
      this._cardProp.rect.height
    );
    setRenderOffsetHeight(0);

    // Reset editor color to card color
    render(['EditorColor']);

    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.visibility = 'hidden';
    }

    // eslint-disable-next-line no-unused-expressions
    CKEDITOR.instances.editor.getSelection()?.removeAllRanges();

    if (this._codeMode) {
      this.endCodeMode();
    }

    return [dataChanged, data];
  };

  toggleCodeMode = () => {
    if (!this._codeMode) {
      this.startCodeMode();
    }
    else {
      this.endCodeMode();
    }
  };

  startCodeMode = () => {
    this._codeMode = true;
    this.startEdit();
    document.getElementById('codeBtn')!.style.color = '#ff0000';
    CKEDITOR.instances.editor.setMode('source', () => {});
    CKEDITOR.instances.editor.focus();

    // In code mode, editor background color is changed to white.
  };

  endCodeMode = async () => {
    this._codeMode = false;
    document.getElementById('codeBtn')!.style.color = '#000000';
    CKEDITOR.instances.editor.setMode('wysiwyg', () => {});
    await this.waitUntilActivationComplete();

    // Reset editor color to card color
    render(['EditorColor']);

    CKEDITOR.instances.editor.focus();
  };

  setSize = (
    width: number = this._cardProp.rect.width -
      this._cardCssStyle.border.left -
      this._cardCssStyle.border.right,
    height: number = this._cardProp.rect.height +
      this._TOOLBAR_HEIGHT -
      this._cardCssStyle.border.top -
      this._cardCssStyle.border.bottom -
      document.getElementById('titleBar')!.offsetHeight
  ): void => {
    // width of BrowserWindow (namely cardProp.rect.width) equals border + padding + content.
    const editor = CKEDITOR.instances.editor;
    if (editor) {
      CKEDITOR.instances.editor.resize(width, height);
    }
    else {
      logger.error(`Error in setSize: editor is undefined.`);
    }
  };

  setColor = (backgroundRgba: string, darkerRgba: string): void => {
    if (this._cardProp.style.backgroundOpacity === 0 && this._isEditing) {
      backgroundRgba = 'rgba(255, 255, 255, 1.0)';
      darkerRgba = 'rgba(204, 204, 204, 1.0)';
    }

    const editor = document.getElementById('cke_editor');
    if (editor) {
      editor.style.borderTopColor = darkerRgba;
    }
    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.backgroundColor = toolbar.style.borderBottomColor = toolbar.style.borderTopColor = darkerRgba;
    }

    const contents = document.querySelector(
      '#cke_1_contents .cke_wysiwyg_frame'
    ) as HTMLElement;
    if (contents) {
      contents.style.backgroundColor = backgroundRgba;
    }
  };
}
