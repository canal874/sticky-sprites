/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingPageSecurity.css';
import { MessageContext } from './StoreProvider';
import { MenuItemProps } from './MenuItem';
import { SettingPageTemplate } from './SettingPageTemplate';

export interface SettingPageSecurityProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageSecurity = (props: SettingPageSecurityProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;

  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{MESSAGE('securityDetailedText')}</p>
    </SettingPageTemplate>
  );
};
