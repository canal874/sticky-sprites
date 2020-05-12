/** 
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Common part
 */

import { CardProp, ICardEditor } from '../modules_common/types';
import { remote } from 'electron';
const main = remote.require('./main');

export class CardEditor implements ICardEditor{
  constructor(public cardProp: CardProp) {
    var sprBorder = parseInt(window.getComputedStyle(document.getElementById('card')).borderLeft);
    var sprWidth = cardProp.width - sprBorder*2;
    var sprHeight = cardProp.height - sprBorder*2;

    document.getElementById('editor').innerHTML = cardProp.data;
    document.getElementById('contents').innerHTML = cardProp.data;

    CKEDITOR.config.width =  sprWidth;
    CKEDITOR.config.height =  sprHeight - document.getElementById('titleBar').offsetHeight - this.toolbarHeight; 

    CKEDITOR.replace('editor'); 
    CKEDITOR.on('instanceReady', () => {
      this.isEditorReady = true;
      document.getElementById('cke_editor').style.borderTopColor
        = document.getElementById('cke_1_bottom').style.backgroundColor
        = document.getElementById('cke_1_bottom').style.borderBottomColor
        = document.getElementById('cke_1_bottom').style.borderTopColor
        = cardProp.titleColor;
      (document.querySelector('#cke_1_contents .cke_wysiwyg_frame') as HTMLElement).style.backgroundColor = cardProp.bgColor;
    });


  }

  /**
   * Private
   */
  private isEditorOpened = false;
  private codeMode = false;
  private toolbarHeight = 30;
  
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

  private execAfterWysiwygChanged = (func: any) => {
    let editor = CKEDITOR.instances['editor'];
    let s = editor.getSelection(); // getting selection
    if (s) {
      func();
    }
    else {
      setTimeout(() => { this.execAfterWysiwygChanged(func) }, 100);
    }
  };

  /**
   * Public
   */
  public resizedByCode = false;    
  public hasCodeMode = true;
  public isEditorReady: boolean = false;

  startEditMode = () => {
    if (!this.isEditorOpened) {
      this.resizedByCode = false;
      main.setCardHeight(this.cardProp.id, main.getCardHeight(this.cardProp.id) + this.toolbarHeight);
      this.isEditorOpened = true;
    }

    document.getElementById('contents').style.visibility = 'hidden';
    document.getElementById('cke_editor').style.visibility = 'visible';
    this.execAfterWysiwygChanged(
      () => {
        CKEDITOR.instances['editor'].focus();
        this.moveCursorToBottom();
      }
    );

  };

  endEditMode = () => {
    this.isEditorOpened = false;
    main.setCardHeight(this.cardProp.id, main.getCardHeight(this.cardProp.id) - this.toolbarHeight);

    let data = CKEDITOR.instances['editor'].getData();
    document.getElementById('contents').innerHTML = data;
    document.getElementById('contents').style.visibility = 'visible';
    setTimeout(() => {
      main.saveCard(new CardProp(this.cardProp.id, data, undefined, undefined, undefined, undefined, undefined, undefined))
    }, 1);
    document.getElementById('cke_editor').style.visibility = 'hidden';

    this.codeMode = false;
    document.getElementById('codeBtn').style.color = '#000000';
    CKEDITOR.instances['editor'].setMode('wysiwyg', () => { });
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
    this.execAfterWysiwygChanged(
      () => {
        (document.querySelector('#cke_1_contents .cke_wysiwyg_frame') as HTMLElement).style.backgroundColor = this.cardProp.bgColor;
        CKEDITOR.instances['editor'].focus();
        this.moveCursorToBottom();
      }
    );
  };

  setSize = (width: number, height: number) => {
      CKEDITOR.instances['editor'].resize(width, height - document.getElementById('titleBar').offsetHeight);
  }
}
