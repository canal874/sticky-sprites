/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { GlobalContext } from './StoreProvider';
import './SettingPageLanguage.css';
import { MenuItemProps } from './MenuItem';
import { availableLanguages, MessageLabel } from '../modules_common/i18n';
import { SettingPageTemplate } from './SettingPageTemplate';
import { SelectableTag } from './SelectableTag';

export interface SettingPageLanguageProps {
  item: MenuItemProps;
  index: number;
}

export const SettingPageLanguage = (props: SettingPageLanguageProps) => {
  const [globalState, globalDispatch] = React.useContext(GlobalContext);

  const MESSAGE = globalState.MESSAGE;

  const handleClick = (value: string) => {
    globalDispatch({ type: 'UpdateLanguageSetting', payload: value });
  };

  const languages = availableLanguages.map(lang => (
    <SelectableTag
      click={handleClick}
      label={MESSAGE(lang)}
      value={lang}
      selected={globalState.settings.language === lang}
    ></SelectableTag>
  ));

  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{MESSAGE('languageDetailedText')}</p>
      <p>
        <div styleName='currentLanguageLabel'>{MESSAGE('currentLanguage')}:</div>
        <SelectableTag
          click={handleClick}
          label={MESSAGE(globalState.settings.language)}
          value={globalState.settings.language}
          selected={true}
        ></SelectableTag>
      </p>
      <p style={{ clear: 'both' }}>{MESSAGE('selectableLanguages')}:</p>
      <div styleName='selectableLanguagesArea'>{languages}</div>
    </SettingPageTemplate>
  );
};
