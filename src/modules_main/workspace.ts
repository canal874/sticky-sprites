/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { scheme } from '../modules_common/const';

let currentWorkspaceId = '0';
let lastIdOfWorkspace = '0';
export const getCurrentWorkspaceUrl = () => {
  // TODO: Check if does current workspace exist
  // TODO: Create and save workspace if there is no workspace
  return `${scheme}://local/${currentWorkspaceId}/`;
};
export const getCurrentWorkspaceId = () => {
  // TODO: Check if does current workspace exist
  // TODO: Create and save workspace if there is no workspace
  return currentWorkspaceId;
};
export const setCurrentWorkspaceId = (id: string) => {
  currentWorkspaceId = id;
};
export const setLastIdOfWorkspace = (id: string) => {
  lastIdOfWorkspace = id;
};
export const getNextWorkspaceId = () => {
  let lastId = parseInt(lastIdOfWorkspace, 10);
  return `${lastId++}`;
};
