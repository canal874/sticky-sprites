/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingPageSecurity.css';
import { GlobalContext } from './StoreProvider';
import { MenuItemProps } from './MenuItem';
import { SettingPageTemplate } from './SettingPageTemplate';

export interface SettingPageSecurityProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageSecurity = (props: SettingPageSecurityProps) => {
  const [globalState] = React.useContext(GlobalContext);

  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{globalState.MESSAGE('securityDetailedText')}</p>
    </SettingPageTemplate>
  );
};
