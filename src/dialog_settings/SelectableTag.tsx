/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import './SettingPageLanguage.css';

export interface SelectableTagProps {
  click: (value: any) => void;
  label: string;
  value: string;
}

export const SelectableTag = (props: SelectableTagProps) => {
  const handleClick = () => {
    props.click(props.value);
  };
  return <div onClick={handleClick}>{props.label}</div>;
};
