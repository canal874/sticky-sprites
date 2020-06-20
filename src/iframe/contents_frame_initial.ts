/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * ATTENTION: Only types can be import for type checking in iframe.
 */
import { ContentsFrameMessage, InnerClickEvent } from '../modules_common/types';

window.addEventListener('message', (event: { data: ContentsFrameMessage }) => {
  if (!event.data.command) {
    return;
  }
  if (event.data.command === 'overwrite-iframe' && event.data.arg !== undefined) {
    document.write(event.data.arg);
    document.close();
  }
});