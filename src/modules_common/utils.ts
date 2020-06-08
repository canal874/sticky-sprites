/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import log4js from 'log4js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ipcRenderer } from 'electron';

dayjs.extend(utc);

export const logger = log4js.getLogger();
logger.level = 'all';
// logger.level = 'error';

export const sleep = (msec: number) =>
  new Promise<void>(resolve => setTimeout(resolve, msec));

export const getCurrentDate = (): string => {
  // @ts-ignore
  return dayjs.utc().format('YYYY-MM-DD HH:mm:ss');
};

export const getImageTag = (
  id: string,
  src: string,
  width: number,
  height: number
): string => {
  return (
    '<img id="' +
    id +
    '" src="' +
    src +
    '" width="' +
    width +
    '" height="' +
    height +
    '" />'
  );
};

export const convertHexColorToRgba = (
  colorHEX: string,
  opacity = 1.0,
  darkRate = 1.0
): string => {
  colorHEX.match(/#(\w\w)(\w\w)(\w\w)/);
  const red = Math.floor(parseInt(RegExp.$1, 16) * darkRate);
  const green = Math.floor(parseInt(RegExp.$2, 16) * darkRate);
  const blue = Math.floor(parseInt(RegExp.$3, 16) * darkRate);

  const rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + opacity + ')';

  return rgba;
};

/**
 * Show modal dialog for alert
 * @param id
 * @param msg
 */
export const alertDialog = async (id: string, msg: string) => {
  await ipcRenderer.invoke('alert-dialog', id, msg);
};
