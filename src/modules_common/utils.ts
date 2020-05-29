/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import log4js from 'log4js';
import moment from 'moment';

export const logger = log4js.getLogger();
logger.level = 'all';
//logger.level = 'error';

export const sleep = (msec: number) =>
  new Promise<void>(resolve => setTimeout(resolve, msec));

export const getCurrentDate = (): string => {
  return moment.utc().format('YYYY-MM-DD HH:mm:ss');
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
    '">'
  );
};

export const convertHexColorToRgba = (
  colorHEX: string,
  opacity: number = 1.0,
  darkRate: number = 1.0
): string => {
  colorHEX.match(/#(\w\w)(\w\w)(\w\w)/);
  const red = Math.floor(parseInt(RegExp.$1, 16) * darkRate);
  const green = Math.floor(parseInt(RegExp.$2, 16) * darkRate);
  const blue = Math.floor(parseInt(RegExp.$3, 16) * darkRate);

  const rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + opacity + ')';

  return rgba;
};
