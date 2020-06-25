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

ipcRenderer.on('message', (event, msg: ContentsFrameMessage) => {
  if (msg === undefined) {
    return;
  }
  if (!contentsFrameCommand.includes(msg.command)) {
    return;
  }
  if (msg.command === 'overwrite-iframe' && msg.arg !== undefined) {
    document.write(msg.arg);
    document.close();
  }
  else if (msg.command === 'zoom' && msg.arg !== undefined) {
    if (document.body) {
      document.body.style.zoom = msg.arg;
    }
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
