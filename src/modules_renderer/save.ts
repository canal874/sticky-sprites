/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

import { checkServerIdentity } from 'tls';
import { ipcRenderer } from 'electron';
import { CardProp, CardPropSerializable } from '../modules_common/cardprop';
import { MESSAGE, setTitleMessage } from './card_renderer';
import { getCurrentDate, logger } from '../modules_common/utils';
import { DialogButton } from '../modules_common/types';

const unfinishedTasks: CardPropSerializable[] = [];

export const waitUnfinishedTasks = (id: string) => {
  return new Promise((resolve, reject) => {
    if (unfinishedTasks.length > 0) {
      let timeoutCounter = 0;
      const checker = async () => {
        if (unfinishedTasks.length === 0) {
          resolve();
        }
        else if (timeoutCounter >= 10) {
          await ipcRenderer
            .invoke('confirm-dialog', id, ['Ok', 'Cancel'], MESSAGE.confirmWaitMore)
            .then((res: number) => {
              if (res === DialogButton.Default) {
                // OK
                timeoutCounter = 0;
              }
              else if (res === DialogButton.Cancel) {
                // Cancel
                reject(new Error('Canceled by user'));
              }
              else if (res === DialogButton.Error) {
                logger.error('Error in confirm-dialog');
              }
            })
            .catch(() => {});
        }
        timeoutCounter++;
        setTimeout(checker, 500);
      };
      setTimeout(checker, 500);
    }
    else {
      resolve();
    }
  });
};

const execSaveTask = async () => {
  if (unfinishedTasks.length === 1) {
    const timeout = setTimeout(() => {
      setTitleMessage('[saving...]');
    }, 1000);

    // Execute the first task
    await ipcRenderer.invoke('save', unfinishedTasks[0]).catch(() => {
      // TODO: Handle save error.
    });
    const finishedPropObject = unfinishedTasks.shift();
    logger.debug(`Dequeue unfinishedTask: ${finishedPropObject?.modifiedDate}`);
    clearTimeout(timeout);
    setTitleMessage('');
    if (unfinishedTasks.length > 0) {
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
  while (unfinishedTasks.length > 1) {
    const poppedPropObject = unfinishedTasks.pop();
    logger.debug(`Skip unfinishedTask: ${poppedPropObject?.modifiedDate}`);
  }
  logger.debug(`Enqueue unfinishedTask: ${propObject.modifiedDate}`);
  // Here, current length of unfinishedTasks should be 0 or 1.
  unfinishedTasks.push(propObject);
  // Here, current length of unfinishedTasks is 1 or 2.
  execSaveTask();
};
