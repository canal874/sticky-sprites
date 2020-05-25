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

import { CardProp } from '../modules_common/card';
import { ICardEditor, CardCssStyle, EditorType } from '../modules_common/types';
import { setRenderOffsetHeight } from '../card_renderer';
import { remote, ipcRenderer } from 'electron';
import { sleep, logger } from '../modules_common/utils';

const main = remote.require('./main');

export class CardEditor implements ICardEditor {
  constructor() { }

  /**
   * Private
   */
  private codeMode = false;
  private toolbarHeight = 30;

  private startEditorFirstTime = true;

  private cardProp: CardProp = new CardProp('');

  private cardCssStyle!: CardCssStyle; // cardCssStyle is set by loadUI()

  private moveCursorToBottom = () => {
    let editor = CKEDITOR.instances['editor'];
    let s = editor.getSelection(); // getting selection
    let selected_ranges = s.getRanges(); // getting ranges
    if(selected_ranges.length > 0) {
      let node = selected_ranges[0].startContainer; // selecting the starting node
      let parents = node.getParents(true);
      node = (parents[parents.length - 2] as CKEDITOR.dom.element).getFirst() as CKEDITOR.dom.element;
      while(true) {
        let x: CKEDITOR.dom.element = node.getNext() as CKEDITOR.dom.element;
        if(x == null) {
          break;
        }
        node = x;
      }

      s.selectElement(node);
      selected_ranges = s.getRanges();
      selected_ranges[0].collapse(false);  //  false collapses the range to the end of the selected node, true before the node.
      s.selectRanges(selected_ranges);  // putting the current selection there
    }
  };


  /**
   * Public
   */
  public editorType: EditorType = 'WYSYWIG';
//  public editorType: EditorType = 'Markup';

  public hasCodeMode = true;

  public isOpened = false;

  loadUI = (_cardCssStyle: CardCssStyle) => {
    this.cardCssStyle = _cardCssStyle;
    return new Promise<void>((resolve, reject) => {
      CKEDITOR.replace('editor');
      CKEDITOR.on('instanceReady', () => {
        const checkTimer = setInterval(() => {
          // Checking existence of 'cke_editor' 
          // because 'instanceReady' event is incredible.
          if(document.getElementById('cke_editor')) {
            clearInterval(checkTimer);
            resolve();
          }
        }, 200);
      });
    });
  };

  loadCard = (prop: CardProp) => {
    this.cardProp = prop;
  }

  waitUntilActivationComplete = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const editor = CKEDITOR.instances['editor'];
      const timer = setInterval(() => {
        const s = editor.getSelection();
        if(s) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  };
  
  showEditor = () => {
    if(!this.isOpened) {
      this.isOpened = true;

      this.setColor(this.cardProp.style.backgroundColor, this.cardProp.style.titleColor);
      this.setSize();

      document.getElementById('contents')!.style.visibility = 'hidden';
      document.getElementById('cke_editor')!.style.visibility = 'visible';

      return new Promise<void>((resolve, reject) => {
        try{
          CKEDITOR.instances['editor'].setData(this.cardProp.data, {
            callback: () => { resolve(); }
          });
        } catch(e){
          reject();
        }
      });
    }
    else{
      return Promise.resolve();
    }
  };

  hideEditor = () => {
    this.isOpened = false;    
    document.getElementById('contents')!.style.visibility = 'visible';
    document.getElementById('cke_editor')!.style.visibility = 'hidden';
  };

  startEdit = async () => {
    if(this.startEditorFirstTime){
      /**
       * This is workaround for Japanese IME & CKEditor on Windows.
       * IME window is unintentionally opened only at the first time of inputing Japanese.
       * Expected behavior is that IME aloways work inline on CKEditor.
       * A silly workaround is to blur and focus this browser window.
       */
      // workaround start
      this.startEditorFirstTime = false;      
      await ipcRenderer.invoke('blurAndFocus', this.cardProp.id);
      setTimeout(async () => {
        await this.showEditor();
        this.startEdit();
      },100);
      return;
      // workaround end
    }

    if(this.isOpened) {
      // Expand card to add toolbar.
      const expandedHeight = this.cardProp.rect.height + this.toolbarHeight;
      main.setWindowSize(this.cardProp.id, this.cardProp.rect.width, expandedHeight);
      setRenderOffsetHeight(-this.toolbarHeight);
      this.setSize();

      await this.waitUntilActivationComplete();
      CKEDITOR.instances['editor'].focus();
      if(this.editorType == 'Markup'){        
        this.moveCursorToBottom();
      }
    }
  };

  endEdit = (): [boolean, string] => {
    let dataChanged = false;
    // Save data to CardProp
    const data = CKEDITOR.instances['editor'].getData();
    if(this.cardProp.data != data) {
      dataChanged = true;
    }

    main.setWindowSize(this.cardProp.id, this.cardProp.rect.width, this.cardProp.rect.height);
    setRenderOffsetHeight(0);

    this.codeMode = false;
    document.getElementById('codeBtn')!.style.color = '#000000';
    CKEDITOR.instances['editor'].getSelection().removeAllRanges();
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => { });

    return [dataChanged, data];
  };


  toggleCodeMode = () => {
    if(!this.codeMode) {
      this.startCodeMode();
    }
    else {
      this.endCodeMode();
    }
  }

  startCodeMode = () => {
    this.codeMode = true;
    this.startEdit();
    document.getElementById('codeBtn')!.style.color = '#a0a0a0';
    CKEDITOR.instances['editor'].setMode('source', () => { });
    CKEDITOR.instances['editor'].focus();
  };

  endCodeMode = async () => {
    this.codeMode = false;
    document.getElementById('codeBtn')!.style.color = '#000000';
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => { });
    await this.waitUntilActivationComplete();
    this.setColor(this.cardProp.style.backgroundColor, this.cardProp.style.titleColor);
    CKEDITOR.instances['editor'].focus();
    this.moveCursorToBottom();
  };

  setSize = (width: number = this.cardProp.rect.width - this.cardCssStyle.border.left - this.cardCssStyle.border.right,
    height: number = this.cardProp.rect.height + this.toolbarHeight - this.cardCssStyle.border.top - this.cardCssStyle.border.bottom - document.getElementById('titleBar')!.offsetHeight): void => {
    // width of BrowserWindow (namely cardProp.rect.width) equals border + padding + content.
    CKEDITOR.instances['editor'].resize(width, height);
  };

  setColor = (backgroundColor: string, titleColor: string): void => {
    document.getElementById('cke_editor')!.style.borderTopColor
      = document.getElementById('cke_1_bottom')!.style.backgroundColor
      = document.getElementById('cke_1_bottom')!.style.borderBottomColor
      = document.getElementById('cke_1_bottom')!.style.borderTopColor
      = titleColor;
    (document.querySelector('#cke_1_contents .cke_wysiwyg_frame') as HTMLElement).style.backgroundColor = backgroundColor;
  };

}

