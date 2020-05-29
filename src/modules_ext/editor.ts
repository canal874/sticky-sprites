/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Common part
 */

import { CardProp } from '../modules_common/cardprop';
import { ICardEditor, CardCssStyle, EditorType } from '../modules_common/types';
import {
  render,
  setRenderOffsetHeight,
} from '../modules_renderer/card_renderer';
import uniqid from 'uniqid';
import { remote, ipcRenderer } from 'electron';
import { logger, sleep, getImageTag } from '../modules_common/utils';
import { saveData, saveCardColor } from '../modules_renderer/save';

const main = remote.require('./main');

export class CardEditor implements ICardEditor {
  private ERROR_FAILED_TO_SET_DATA = 'Failed to set data.';
  /**
   * Private
   */
  private codeMode = false;
  private toolbarHeight = 30;

  private startEditorFirstTime = true;

  private cardProp: CardProp = new CardProp('');

  private cardCssStyle!: CardCssStyle; // cardCssStyle is set by loadUI()

  private moveCursorToBottom = (): void => {
    const editor = CKEDITOR.instances['editor'];
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

  private isEditing = false;

  loadUI = (_cardCssStyle: CardCssStyle): Promise<void> => {
    this.cardCssStyle = _cardCssStyle;
    return new Promise<void>(resolve => {
      CKEDITOR.replace('editor');
      CKEDITOR.on('instanceReady', () => {
        const checkTimer = setInterval(() => {
          // Checking existence of 'cke_editor'
          // and container
          // because 'instanceReady' event is incredible.
          if (
            document.getElementById('cke_editor') &&
            CKEDITOR.instances['editor'].container
          ) {
            clearInterval(checkTimer);
            resolve();
          }
        }, 200);
      });
    });
  };

  setCard = (prop: CardProp): void => {
    this.cardProp = prop;
  };

  waitUntilActivationComplete = (): Promise<void> => {
    return new Promise(resolve => {
      const editor = CKEDITOR.instances['editor'];
      const timer = setInterval(() => {
        const s = editor.getSelection();
        if (s) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  };

  private imeWorkaround = async (): Promise<void> => {
    /**
     * This is workaround for Japanese IME & CKEditor on Windows.
     * IME window is unintentionally opened only at the first time of inputting Japanese.
     * Expected behavior is that IME always work inline on CKEditor.
     * A silly workaround is to blur and focus this browser window.
     */
    await ipcRenderer.invoke('blurAndFocus', this.cardProp.id);
  };

  private setData = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        CKEDITOR.instances['editor'].setData(this.cardProp.data, {
          callback: () => {
            const currentData = CKEDITOR.instances['editor'].getData();
            // setData is easy to fail.
            if (this.cardProp.data != currentData) {
              reject(this.ERROR_FAILED_TO_SET_DATA);
            }
            else {
              resolve();
            }
          },
        });
      } catch (e) {
        reject('Unexpected error');
      }
    });
  };

  private addDragAndDropEvent = () => {
    //    CKEDITOR.instances['editor'].on('drop', async evt => {});
    // paste event is automatically occurred after drop.
    CKEDITOR.instances['editor'].on('paste', evt => {
      const id = uniqid();
      const dataTransfer = evt.data.dataTransfer;
      if (dataTransfer.$.files) {
        const file = dataTransfer.$.files[0];
        if (file) {
          const dropImg = new Image();
          dropImg.onload = () => {
            let width = dropImg.naturalWidth;
            let height = dropImg.naturalHeight;

            let newWidth = this.cardProp.rect.width - 15;
            let newHeight = height;
            if (newWidth < width) {
              newHeight = (height * newWidth) / width;
            }
            else {
              newWidth = width;
            }

            newWidth = Math.floor(newWidth);
            newHeight = Math.floor(newHeight);

            const doc = CKEDITOR.instances['editor'].document.$;
            const img = doc.getElementById(id);
            if (img) {
              img.setAttribute('width', `${newWidth}`);
              img.setAttribute('height', `${newHeight}`);
            }
            this.cardProp.data = CKEDITOR.instances['editor'].getData();

            this.cardProp.rect.height += newHeight;
            main.setWindowSize(
              this.cardProp.id,
              this.cardProp.rect.width,
              this.cardProp.rect.height
            );
            render(['Decoration', 'EditorRect']);
            saveData(this.cardProp);
          };
          const imgTag = getImageTag(id, file!.path, 1, 1);
          evt.data.dataValue = imgTag;
          if (this.cardProp.data == '') {
            this.cardProp.rect.height = this.toolbarHeight + 15;
            saveCardColor(this.cardProp, '#ffffff', '#ffffff', 0.0);
            render();
          }

          dropImg.src = file.path;
        }
      }
    });
  };

  showEditor = async (): Promise<void> => {
    console.debug(`showEditor: ${this.cardProp.id}`);
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
      throw 'cke_editor does not exist.';
    }

    let contCounter = 0;
    for (;;) {
      let cont = false;
      await this.setData().catch(e => {
        if (e == this.ERROR_FAILED_TO_SET_DATA) {
          sleep(1000);
          contCounter++;
          cont = true;
        }
        else {
          // logger.error does not work in ipcRenderer event.
          console.error(`Error in showEditor ${this.cardProp.id}: ${e}`);
          cont = false;
        }
      });
      if (contCounter >= 10) {
        // logger.error does not work in ipcRenderer event.
        console.error(
          `Error in showEditor ${this.cardProp.id}: too many setData errors`
        );
        alert(main.MESSAGE.pleaseRestartErrorInOpeningCard);
        cont = false;
      }
      if (!cont) {
        break;
      }
      else {
        console.debug(`re-trying setData for ${this.cardProp.id}`);
      }
    }

    this.addDragAndDropEvent();

    this.isOpened = true;
  };

  hideEditor = () => {
    this.isOpened = false;
    document.getElementById('contents')!.style.visibility = 'visible';
    document.getElementById('cke_editor')!.style.visibility = 'hidden';
  };

  startEdit = async () => {
    this.isEditing = true;
    render(['EditorColor']);

    if (this.startEditorFirstTime) {
      this.startEditorFirstTime = false;
      await this.imeWorkaround();
    }
    // Expand card to add toolbar.
    const expandedHeight = this.cardProp.rect.height + this.toolbarHeight;
    main.setWindowSize(
      this.cardProp.id,
      this.cardProp.rect.width,
      expandedHeight
    );
    setRenderOffsetHeight(-this.toolbarHeight);

    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.visibility = 'visible';
    }

    await this.waitUntilActivationComplete();
    CKEDITOR.instances['editor'].focus();
    if (this.editorType == 'Markup') {
      this.moveCursorToBottom();
    }
  };

  endEdit = (): [boolean, string] => {
    this.isEditing = false;

    let dataChanged = false;
    // Save data to CardProp
    const data = CKEDITOR.instances['editor'].getData();
    if (this.cardProp.data != data) {
      dataChanged = true;
    }

    main.setWindowSize(
      this.cardProp.id,
      this.cardProp.rect.width,
      this.cardProp.rect.height
    );
    setRenderOffsetHeight(0);

    // Reset editor color to card color
    render(['EditorColor']);

    const toolbar = document.getElementById('cke_1_bottom');
    if (toolbar) {
      toolbar.style.visibility = 'hidden';
    }

    CKEDITOR.instances['editor'].getSelection()?.removeAllRanges();

    if (this.codeMode) {
      this.endCodeMode();
    }

    return [dataChanged, data];
  };

  toggleCodeMode = () => {
    if (!this.codeMode) {
      this.startCodeMode();
    }
    else {
      this.endCodeMode();
    }
  };

  startCodeMode = () => {
    this.codeMode = true;
    this.startEdit();
    document.getElementById('codeBtn')!.style.color = '#ff0000';
    CKEDITOR.instances['editor'].setMode('source', () => {});
    CKEDITOR.instances['editor'].focus();

    // In code mode, editor background color is changed to white.
  };

  endCodeMode = async () => {
    this.codeMode = false;
    document.getElementById('codeBtn')!.style.color = '#000000';
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => {});
    await this.waitUntilActivationComplete();

    // Reset editor color to card color
    render(['EditorColor']);

    CKEDITOR.instances['editor'].focus();
  };

  setSize = (
    width: number = this.cardProp.rect.width -
      this.cardCssStyle.border.left -
      this.cardCssStyle.border.right,
    height: number = this.cardProp.rect.height +
      this.toolbarHeight -
      this.cardCssStyle.border.top -
      this.cardCssStyle.border.bottom -
      document.getElementById('titleBar')!.offsetHeight
  ): void => {
    // width of BrowserWindow (namely cardProp.rect.width) equals border + padding + content.
    const editor = CKEDITOR.instances['editor'];
    if (editor) {
      CKEDITOR.instances['editor'].resize(width, height);
    }
    else {
      logger.error(`Error in setSize: editor is undefined.`);
    }
  };

  setColor = (backgroundRgba: string, darkerRgba: string): void => {
    if (this.cardProp.style.backgroundOpacity == 0 && this.isEditing) {
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
