/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingsDialogTitle.css';
import { MessageLabel } from '../modules_common/i18n';
import { MessageContext } from './StoreProvider';

export interface SettingsDialogTitleProps {
  title: MessageLabel;
}

export const SettingsDialogTitle = (props: SettingsDialogTitleProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;
  return (
    <h1 styleName='title'>
      <span className='fas fa-cog'></span>&nbsp;&nbsp;{MESSAGE(props.title)}
    </h1>
  );
};
