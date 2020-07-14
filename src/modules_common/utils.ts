/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

export const sleep = (msec: number) =>
  new Promise<void>(resolve => setTimeout(resolve, msec));

export const getCurrentDateAndTime = (): string => {
  // Returns UTC date with 'YYYY-MM-DD HH:mm:ss' format
  return new Date().toISOString().replace(/^(.+?)T(.+?)\..+?$/, '$1 $2');
};
