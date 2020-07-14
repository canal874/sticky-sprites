/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Logger for Main process
 * In sandboxed Renderer process, use console.log instead of logger modules.
 */
import log4js from 'log4js';
export const logger = log4js.getLogger();
logger.level = 'all';
// logger.level = 'error';
