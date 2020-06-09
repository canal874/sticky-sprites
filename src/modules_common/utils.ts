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

export const getCurrentDateAndTime = (): string => {
  // @ts-ignore
  return dayjs.utc().format('YYYY-MM-DD HH:mm:ss');
};

export const getCurrentDate = (): string => {
  // @ts-ignore
  return dayjs.utc().format('YYYY-MM-DD');
};

export const getImageTag = (
  id: string,
  src: string,
  width: number,
  height: number,
  alt: string
): string => {
  return `<img id="${id}" src="${src}" alt="${alt}" width="${width}" height="${height}" />`;
};

export const darkenHexColor = (colorHEX: string, darkRate: number): string => {
  if (darkRate > 1 || darkRate < 0) {
    logger.error(`Invalid darkRate: ${darkRate}`);
    return '#000000';
  }
  const res = colorHEX.match(/#(\w\w)(\w\w)(\w\w)/);
  let red = parseInt(RegExp.$1, 16);
  let green = parseInt(RegExp.$2, 16);
  let blue = parseInt(RegExp.$3, 16);
  if (res === null || isNaN(red) || isNaN(blue) || isNaN(blue)) {
    logger.error(`Invalid HEX color format: ${colorHEX}`);
    return '#000000';
  }
  red = Math.round(red * darkRate);
  green = Math.round(green * darkRate);
  blue = Math.round(blue * darkRate);
  if (red > 255 || green > 255 || red > 255) {
    logger.error(`Invalid HEX value: ${colorHEX}`);
    return '#000000';
  }

  return (
    '#' +
    red.toString(16).padStart(2, '0') +
    green.toString(16).padStart(2, '0') +
    blue.toString(16).padStart(2, '0')
  );
};

export const convertHexColorToRgba = (colorHEX: string, opacity = 1.0): string => {
  const res = colorHEX.match(/^#(\w\w)(\w\w)(\w\w)$/);
  const red = parseInt(RegExp.$1, 16);
  const green = parseInt(RegExp.$2, 16);
  const blue = parseInt(RegExp.$3, 16);
  if (res === null || isNaN(red) || isNaN(blue) || isNaN(blue)) {
    logger.error(`Invalid HEX color format: ${colorHEX}`);
    return 'rgba(255,255,255,1.0)';
  }
  if (red > 255 || green > 255 || red > 255) {
    logger.error(`Invalid HEX value: ${colorHEX}`);
    return '#000000';
  }

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
