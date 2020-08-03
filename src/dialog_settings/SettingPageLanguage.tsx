/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { AppSettingsContext, AppSettingsProvider, MessageContext } from './StoreProvider';
import './SettingPageLanguage.css';
import { cardColors, ColorName } from '../modules_common/color';
import { MenuItemProps } from './MenuItem';
import { MessageLabel } from '../modules_common/i18n';
import { SettingPageTemplate } from './SettingPageTemplate';

export interface SettingPageLanguageProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageLanguage = (props: SettingPageLanguageProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;
  const [appSettingsState, appSettingsDispatch]: AppSettingsProvider = React.useContext(
    AppSettingsContext
  );
  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{MESSAGE('languageDetailedText')}</p>
      <p>
        {MESSAGE('currentLanguage')}:&nbsp;&nbsp;
        {MESSAGE(appSettingsState.settings.language as MessageLabel)}
      </p>
    </SettingPageTemplate>
  );
};
