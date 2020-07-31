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

export interface SettingPageLanguageProps {}

export const SettingPageLanguage = (props: SettingPageLanguageProps) => {
  const MESSAGE = React.useContext(MessageContext).MESSAGE;
  const [appSettingsState, appSettingsDispatch]: AppSettingsProvider = React.useContext(
    AppSettingsContext
  );
  return (
    <div styleName='settingPageLanguage'>
      <p>{MESSAGE('languageDetailedText')}</p>
      <p>
        {MESSAGE('currentLanguage')}: {appSettingsState.settings.language}
      </p>
    </div>
  );
};
