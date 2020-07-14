/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

export const darkenHexColor = (colorHEX: string, darkRate: number): string => {
  if (darkRate > 1 || darkRate < 0) {
    console.error(`Invalid darkRate: ${darkRate}`);
    return '#000000';
  }
  const res = colorHEX.match(/#(\w\w)(\w\w)(\w\w)/);
  let red = parseInt(RegExp.$1, 16);
  let green = parseInt(RegExp.$2, 16);
  let blue = parseInt(RegExp.$3, 16);
  if (res === null || isNaN(red) || isNaN(blue) || isNaN(blue)) {
    console.error(`Invalid HEX color format: ${colorHEX}`);
    return '#000000';
  }
  red = Math.round(red * darkRate);
  green = Math.round(green * darkRate);
  blue = Math.round(blue * darkRate);
  if (red > 255 || green > 255 || red > 255) {
    console.error(`Invalid HEX value: ${colorHEX}`);
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
    console.error(`Invalid HEX color format: ${colorHEX}`);
    return 'rgba(255,255,255,1.0)';
  }
  if (red > 255 || green > 255 || red > 255) {
    console.error(`Invalid HEX value: ${colorHEX}`);
    return '#000000';
  }

  const rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + opacity + ')';

  return rgba;
};
