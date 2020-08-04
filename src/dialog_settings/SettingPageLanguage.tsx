/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { GlobalContext, GlobalProvider } from './StoreProvider';
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
  const [globalState, globalDispatch] = React.useContext(GlobalContext) as GlobalProvider;

  const handleClick = (value: string) => {
    globalDispatch({ type: 'language', payload: value });
  };

  const languages = availableLanguages.map(lang => (
    <SelectableTag
      click={handleClick}
      label={globalState.messages[lang as MessageLabel]}
      value={lang}
      selected={globalState.language === lang}
    ></SelectableTag>
  ));

  return (
    <SettingPageTemplate item={props.item} index={props.index}>
      <p>{globalState.messages.languageDetailedText}</p>
      <p>
        <div styleName='currentLanguageLabel'>{globalState.messages.currentLanguage}:</div>
        <SelectableTag
          click={handleClick}
          label={globalState.messages[globalState.language as MessageLabel]}
          value={globalState.language}
          selected={true}
        ></SelectableTag>
      </p>
      <p style={{ clear: 'both' }}>{globalState.messages.selectableLanguages}:</p>
      <div>{languages}</div>
    </SettingPageTemplate>
  );
};
