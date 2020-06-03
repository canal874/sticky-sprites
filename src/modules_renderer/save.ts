/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { ipcRenderer, remote } from 'electron';
import { CardProp, CardPropSerializable } from '../modules_common/cardprop';
import { MESSAGE, setTitleMessage } from './card_renderer';
import { getCurrentDate, logger } from '../modules_common/utils';

const unfinishedSaveTasks: CardPropSerializable[] = [];

export const waitUnfinishedSaveTasks = () => {
  return new Promise((resolve, reject) => {
    if (unfinishedSaveTasks.length > 0) {
      let timeoutCounter = 0;
      const timer = setInterval(() => {
        if (unfinishedSaveTasks.length === 0) {
          clearInterval(timer);
          resolve();
        }
        else if (timeoutCounter >= 10) {
          const res = remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Ok', 'Cancel'],
            defaultId: 0,
            cancelId: 1,
            message: MESSAGE.confirmWaitMore,
          });
          if (res === 0) {
            // OK
            timeoutCounter = 0;
          }
          else if (res === 1) {
            // Cancel
            clearInterval(timer);
            reject(new Error('Canceled by user'));
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
  if (unfinishedSaveTasks.length === 1) {
    const timeout = setTimeout(() => {
      setTitleMessage('[saving...]');
    }, 1000);

    // Execute the first task
    await ipcRenderer.invoke('save', unfinishedSaveTasks[0]).catch(() => {
      // TODO: Handle save error.
    });
    const finishedPropObject = unfinishedSaveTasks.shift();
    logger.debug(`Dequeue unfinishedSaveTask: ${finishedPropObject?.modifiedDate}`);
    clearTimeout(timeout);
    setTitleMessage('');
    if (unfinishedSaveTasks.length > 0) {
      execSaveTask();
    }
  }
};

export const saveCardColor = (
  cardProp: CardProp,
  bgColor: string,
  titleColor?: string,
  backgroundOpacity = 1.0
) => {
  if (titleColor === undefined) {
    titleColor = bgColor;
  }
  cardProp.style.backgroundColor = bgColor;
  cardProp.style.titleColor = titleColor;
  cardProp.style.backgroundOpacity = backgroundOpacity;

  saveData(cardProp);
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
