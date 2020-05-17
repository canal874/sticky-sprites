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

import { CardProp, ICardEditor, CardCssStyle } from '../modules_common/types';
import { render, setRenderOffsetHeight, CardRenderOptions } from '../card_renderer';
import { remote } from 'electron';

const main = remote.require('./main');

export class CardEditor implements ICardEditor{
  constructor() {}

  /**
   * Private
   */
  private codeMode = false;
  private toolbarHeight = 30;

  
  private cardProp: CardProp = new CardProp('');

  private cardCssStyle: CardCssStyle;
  
  private moveCursorToBottom = () => {
    let editor = CKEDITOR.instances['editor'];
    let s = editor.getSelection(); // getting selection
    let selected_ranges = s.getRanges(); // getting ranges
    if (selected_ranges.length > 0) {
      let node = selected_ranges[0].startContainer; // selecting the starting node
      let parents = node.getParents(true);
      node = (parents[parents.length - 2] as CKEDITOR.dom.element).getFirst() as CKEDITOR.dom.element;
      while (true) {
        let x: CKEDITOR.dom.element = node.getNext() as CKEDITOR.dom.element;
        if (x == null) {
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
  public hasCodeMode = true;
  public isOpened = false;

  loadUI = (_cardCssStyle: CardCssStyle) => {
    this.cardCssStyle = _cardCssStyle;
    return new Promise<void>((resolve, reject) => {
      CKEDITOR.replace('editor'); 
      console.log('loading editor..');
      CKEDITOR.on('instanceReady', () => {
        const checkTimer = setInterval(()=>{
          // Checking existence of 'cke_editor' 
          // because 'instanceReady' event is incredible.
          if(document.getElementById('cke_editor')){
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
          if (s) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
  };

  startEditMode = () => {
    // Load card data from cardProp

    if (!this.isOpened) {
      // Expand card to add toolbar.
      const expandedHeight = this.cardProp.rect.height + this.toolbarHeight;
      main.setWindowSize(this.cardProp.id, this.cardProp.rect.width, expandedHeight);
      setRenderOffsetHeight(-this.toolbarHeight);      
      this.isOpened = true;

      this.setColor(this.cardProp.style.backgroundColor, this.cardProp.style.titleColor);

      this.setSize();
    }
    
    CKEDITOR.instances['editor'].setData(this.cardProp.data, {
       callback: () => {
        document.getElementById('contents').style.visibility = 'hidden';
        document.getElementById('cke_editor').style.visibility = 'visible';

        this.waitUntilActivationComplete().then(() => {
          CKEDITOR.instances['editor'].focus();
          this.moveCursorToBottom();
        })
      }
    });
  };

  endEditMode = (): boolean => {
    this.isOpened = false;

    let contentsChanged = false;
    // Save data to CardProp
    const data = CKEDITOR.instances['editor'].getData();
    if(this.cardProp.data != data){
      contentsChanged = true;
    }
    this.cardProp.data = data;

    main.setWindowSize(this.cardProp.id, this.cardProp.rect.width, this.cardProp.rect.height);
    setRenderOffsetHeight(0);
    render([ CardRenderOptions.ContentsData, CardRenderOptions.ContentsSize ]);

    // Hide editor
    document.getElementById('contents').style.visibility = 'visible';    
    document.getElementById('cke_editor').style.visibility = 'hidden';

    this.codeMode = false;
    document.getElementById('codeBtn').style.color = '#000000';
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => { });

    return contentsChanged;
  };


  toggleCodeMode = () =>{
    if(!this.codeMode){
      this.startCodeMode();
    }
    else{
      this.endCodeMode();
    }
  }

  startCodeMode = () => {
    this.codeMode = true;
    this.startEditMode();
    document.getElementById('codeBtn').style.color = '#a0a0a0';
    CKEDITOR.instances['editor'].setMode('source', () => { });
    CKEDITOR.instances['editor'].focus();
  };

  endCodeMode = () => {
    this.codeMode = false;
    document.getElementById('codeBtn').style.color = '#000000';
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => { });
    this.waitUntilActivationComplete().then(() => {
      this.setColor(this.cardProp.style.backgroundColor, this.cardProp.style.titleColor);
      CKEDITOR.instances['editor'].focus();
      this.moveCursorToBottom();
    });
  };

  setSize = (width: number = this.cardProp.rect.width - this.cardCssStyle.border.left - this.cardCssStyle.border.right,
            height: number = this.cardProp.rect.height + this.toolbarHeight - this.cardCssStyle.border.top - this.cardCssStyle.border.bottom - document.getElementById('titleBar').offsetHeight): void => {
      // width of BrowserWindow (namely cardProp.rect.width) equals border + padding + content.
      CKEDITOR.instances['editor'].resize(width, height);
  };

  setColor = (backgroundColor: string, titleColor: string): void => {
    document.getElementById('cke_editor').style.borderTopColor
      = document.getElementById('cke_1_bottom').style.backgroundColor
      = document.getElementById('cke_1_bottom').style.borderBottomColor
      = document.getElementById('cke_1_bottom').style.borderTopColor
      = titleColor;
    (document.querySelector('#cke_1_contents .cke_wysiwyg_frame') as HTMLElement).style.backgroundColor = backgroundColor;
  };

}
  
