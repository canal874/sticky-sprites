/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { CardPropSerializable, CardProp } from '../modules_common/card';
import { remote, ipcRenderer } from 'electron';
import { setTitleMessage } from './card_renderer';
import { logger } from '../modules_common/utils';
import { getCurrentDate } from '../modules_common/utils';

const main = remote.require('./main');

let unfinishedSaveTasks: Array<CardPropSerializable> = new Array();

export const waitUnfinishedSaveTasks = () => {
  return new Promise((resolve, reject) => {
    if (unfinishedSaveTasks.length > 0) {
      let timeoutCounter = 0;
      const timer = setInterval(() => {
        if (unfinishedSaveTasks.length == 0) {
          clearInterval(timer);
          resolve();
        }
        else if (timeoutCounter >= 10) {
          const res = remote.dialog.showMessageBoxSync(
            remote.getCurrentWindow(),
            {
              type: 'question',
              buttons: ['Ok', 'Cancel'],
              defaultId: 0,
              cancelId: 1,
              message: main.MESSAGE.confirmWaitMore,
            }
          );
          if (res == 0) {
            // OK
            timeoutCounter = 0;
          }
          else if (res == 1) {
            // Cancel
            clearInterval(timer);
            reject();
          }
        }
        timeoutCounter++;
      }, 500);
    }
    else {
      resolve();
    }
  });
};

const execSaveTask = async () => {
  if (unfinishedSaveTasks.length == 1) {
    const timeout = setTimeout(() => {
      setTitleMessage('[saving...]');
    }, 1000);

    // Execute the first task
    await ipcRenderer.invoke('save', unfinishedSaveTasks[0]).catch(() => {
      // TODO: Handle save error.
    });
    const finishedPropObject = unfinishedSaveTasks.shift();
    logger.debug(
      `Dequeue unfinishedSaveTask: ${finishedPropObject?.modifiedDate}`
    );
    clearTimeout(timeout);
    setTitleMessage('');
    if (unfinishedSaveTasks.length > 0) {
      execSaveTask();
    }
  }
};

export const saveData = (cardProp: CardProp) => {
  cardProp.date.modifiedDate = getCurrentDate();
  const propObject = cardProp.toObject();
  while (unfinishedSaveTasks.length > 1) {
    const poppedPropObject = unfinishedSaveTasks.pop();
    logger.debug(`Skip unfinishedSaveTask: ${poppedPropObject?.modifiedDate}`);
  }
  logger.debug(`Enqueue unfinishedSaveTask: ${propObject.modifiedDate}`);
  // Here, current length of unfinishedSaveTasks should be 0 or 1.
  unfinishedSaveTasks.push(propObject);
  // Here, current length of unfinishedSaveTasks is 1 or 2.
  execSaveTask();
};
