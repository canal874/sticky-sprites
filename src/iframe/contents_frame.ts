/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * ATTENTION: Only types can be import for type checking in iframe.
 */
import {
  ContentsFrameMessage,
  FileDropEvent,
  InnerClickEvent,
} from '../modules_common/types';

window.addEventListener('load', () => {
  const msg: ContentsFrameMessage = {
    command: 'contents-frame-loaded',
    arg: '',
  };
  // Message to parent frame
  // window.webviewPostMessage() is defined in preloaded script
  // @ts-ignore
  window.webviewPostMessage(msg);
});

// window.addEventListener('click', event => {
window.addEventListener('mouseup', event => {
  // 'contents' can be clicked when cardEditor.editorType is 'Markup'
  if (window.getSelection()?.toString() === '') {
    const e: InnerClickEvent = {
      x: event.clientX,
      y: event.clientY,
    };
    const msg: ContentsFrameMessage = {
      command: 'click-parent',
      arg: JSON.stringify(e),
    };
    // Message to parent frame
    // window.webviewPostMessage() is defined in preloaded script
    // @ts-ignore
    window.webviewPostMessage(msg);
  }
});

document.addEventListener('dragenter', e => {
  e.preventDefault();
  return false;
});

document.addEventListener('dragover', e => {
  e.preventDefault();
  return false;
});

document.addEventListener('drop', event => {
  // NOTE: To enable drop event, dragenter and dragover event must be canceled.
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#droptargets
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) {
    const e: FileDropEvent = {
      name: file.name,
      path: file.path,
    };
    const msg: ContentsFrameMessage = {
      command: 'contents-frame-file-dropped',
      arg: JSON.stringify(e),
    };
    // Message to parent frame
    // window.webviewPostMessage() is defined in preloaded script
    // @ts-ignore
    window.webviewPostMessage(msg);
  }
});
