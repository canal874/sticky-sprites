/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import {
  BrowserWindow,
  contextBridge,
  ipcRenderer,
  MouseInputEvent,
  remote,
} from 'electron';

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
  onCardBlurred: (listener: Function) => ipcRenderer.on('card-blurred', () => listener()),
  onCardClose: (listener: Function) => ipcRenderer.on('card-close', () => listener()),
  onCardFocused: (listener: Function) => ipcRenderer.on('card-focused', () => listener()),
  onMoveByHand: (listener: Function) => ipcRenderer.on('move-by-hand', () => listener()),
  onRenderCard: (listener: Function) =>
    ipcRenderer.on('render-card', (event: Electron.IpcRendererEvent, _prop: any) =>
      listener(_prop)
    ),
  onResizeByHand: (listener: Function) =>
    ipcRenderer.on('resize-by-hand', () => listener()),
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
  setWindowSize: (id: string, width: number, height: number) => {
    return ipcRenderer.invoke('set-window-size', id, width, height);
  },
  setTitle: (id: string, title: string) => {
    return ipcRenderer.invoke('set-title', id, title);
  },
});
