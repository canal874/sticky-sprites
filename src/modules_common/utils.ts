/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import log4js from 'log4js';
import moment from 'moment';

/**
 * logger
 */
export const logger = log4js.getLogger();
logger.level = 'all';
//logger.level = 'error';


export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

export const getCurrentDate = () => { return moment.utc().format('YYYY-MM-DD HH:mm:ss'); }