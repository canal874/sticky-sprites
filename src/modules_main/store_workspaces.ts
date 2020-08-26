/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { scheme } from '../modules_common/const';

let currentWorkspaceId = '0'; // string expression of positive number
let lastWorkspaceId = '0';

let nextWorkspaceId = '-1'; // nextWorkspaceId stores next id while workspace is changing. It store '-1' if not.

export type Workspace = {
  name: string;
  avatars: string[];
};
export const workspaces = new Map<string, Workspace>();
export const getCurrentWorkspaceUrl = () => {
  return `${scheme}://local/avatar/${currentWorkspaceId}/`;
};
export const getCurrentWorkspace = () => {
  const workspace = workspaces.get(currentWorkspaceId);
  if (!workspace) {
    throw new Error(
      `Error in getCurrentWorkspace: workspace does not exist: ${currentWorkspaceId}`
    );
  }
  return workspace;
};
export const getCurrentWorkspaceId = () => {
  return currentWorkspaceId;
};
export const setCurrentWorkspaceId = (id: string) => {
  currentWorkspaceId = id;
};
export const getLastWorkspaceId = () => {
  return lastWorkspaceId;
};
export const setLastWorkspaceId = (id: string) => {
  lastWorkspaceId = id;
};
export const getNextWorkspaceId = () => {
  let lastId = parseInt(lastWorkspaceId, 10);
  return `${++lastId}`;
};

export const setNextWorkspaceId = (workspaceId: string) => {
  nextWorkspaceId = workspaceId;
};

export const getChangingWorkspace = () => {
  return nextWorkspaceId;
};
