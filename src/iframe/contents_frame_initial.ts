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
import { ipcRenderer } from 'electron';
import { contentsFrameCommand, ContentsFrameMessage } from '../modules_common/types';

const filterMessage = (msg: ContentsFrameMessage) => {
  if (msg === undefined) {
    return { command: '', arg: '' };
  }
  if (!contentsFrameCommand.includes(msg.command)) {
    return { command: '', arg: '' };
  }
  return msg;
};

ipcRenderer.on('message', (event, _msg: ContentsFrameMessage) => {
  const msg: ContentsFrameMessage = filterMessage(_msg);
  switch (msg.command) {
    case 'overwrite-iframe':
      if (msg.arg !== undefined) {
        document.write(msg.arg);
        document.close();
      }
      break;

    case 'set-scrollbar-style':
      if (msg.arg !== undefined) {
        if (document.head) {
          const style = document.createElement('style');
          style.innerHTML =
            'body::-webkit-scrollbar { width: 7px; background-color: ' +
            msg.arg.backgroundRgba +
            '}\n' +
            'body::-webkit-scrollbar-thumb { background-color: ' +
            msg.arg.uiRgba +
            '}';
          document
            .getElementsByTagName('head')
            .item(0)!
            .appendChild(style);
        }
      }
      break;

    case 'zoom':
      if (msg.arg !== undefined) {
        if (document.body) {
          document.body.style.zoom = msg.arg;
        }
      }
      break;

    default:
      break;
  }
});

// Webview has the isolated scope from this preloaded script file.
// Set window object to functions that can be called from the scope.
// @ts-ignore
window.webviewPostMessage = (msg: ContentsFrameMessage) => {
  if (contentsFrameCommand.includes(msg.command)) {
    ipcRenderer.sendToHost('message', msg);
  }
};
