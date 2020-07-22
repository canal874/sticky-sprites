/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { contextBridge, ipcRenderer, MouseInputEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  alertDialog: (id: string, message: string) => {
    return ipcRenderer.invoke('alert-dialog', id, message);
  },
  blurAndFocusWithSuppressEvents: (id: string) => {
    return ipcRenderer.invoke('blur-and-focus-with-suppress-events', id);
  },
  blurAndFocusWithSuppressFocusEvents: (id: string) => {
    return ipcRenderer.invoke('blur-and-focus-with-suppress-focus-events', id);
  },
  bringToFront: (id: string) => {
    return ipcRenderer.invoke('bring-to-front', id);
  },
  createCard: (subsetOfCardPropSerializable: Record<string, any>) => {
    return ipcRenderer.invoke('create-card', subsetOfCardPropSerializable);
  },
  confirmDialog: (id: string, buttonLabels: string[], message: string) => {
    return ipcRenderer.invoke('confirm-dialog', id, buttonLabels, message);
  },
  deleteCard: (id: string) => {
    return ipcRenderer.invoke('delete-card', id);
  },
  finishLoad: (id: string) => {
    return ipcRenderer.invoke('finish-load-' + id);
  },
  finishRenderCard: (id: string) => {
    return ipcRenderer.invoke('finish-render-card', id);
  },
  focus: (id: string) => {
    return ipcRenderer.invoke('focus', id);
  },
  getUuid: () => {
    return ipcRenderer.invoke('get-uuid');
  },
  saveCard: (cardPropSerializable: Record<string, any>) => {
    return ipcRenderer.invoke('save-card', cardPropSerializable);
  },
  sendLeftMouseDown: (id: string, x: number, y: number) => {
    const leftMouseDown: MouseInputEvent = {
      button: 'left',
      type: 'mouseDown',
      x: x,
      y: y,
    };
    return ipcRenderer.invoke('send-mouse-input', id, leftMouseDown);
  },
  sendToBack: (id: string) => {
    return ipcRenderer.invoke('send-to-back', id);
  },
  setWindowSize: (id: string, width: number, height: number) => {
    return ipcRenderer.invoke('set-window-size', id, width, height);
  },
  setTitle: (id: string, title: string) => {
    return ipcRenderer.invoke('set-title', id, title);
  },
});

ipcRenderer.on('card-blurred', () =>
  window.postMessage({ command: 'card-blurred' }, 'file://')
);
ipcRenderer.on('card-close', () =>
  window.postMessage({ command: 'card-close' }, 'file://')
);
ipcRenderer.on('card-focused', () =>
  window.postMessage({ command: 'card-focused' }, 'file://')
);
ipcRenderer.on(
  'change-card-color',
  (event: Electron.IpcRendererEvent, _backgroundColor: string, _opacity: number) =>
    window.postMessage(
      {
        command: 'change-card-color',
        backgroundColor: _backgroundColor,
        opacity: _opacity,
      },
      'file://'
    )
);

ipcRenderer.on(
  'move-by-hand',
  (event: Electron.IpcRendererEvent, _bounds: Electron.Rectangle) =>
    window.postMessage({ command: 'move-by-hand', bounds: _bounds }, 'file://')
);
ipcRenderer.on('render-card', (event: Electron.IpcRendererEvent, _prop: any) =>
  window.postMessage({ command: 'render-card', prop: _prop }, 'file://')
);
ipcRenderer.on(
  'resize-by-hand',
  (event: Electron.IpcRendererEvent, _bounds: Electron.Rectangle) =>
    window.postMessage({ command: 'resize-by-hand', bounds: _bounds }, 'file://')
);
ipcRenderer.on('send-to-back', () =>
  window.postMessage({ command: 'send-to-back' }, 'file://')
);
ipcRenderer.on('zoom-in', () => window.postMessage({ command: 'zoom-in' }, 'file://'));
ipcRenderer.on('zoom-out', () => window.postMessage({ command: 'zoom-out' }, 'file://'));
