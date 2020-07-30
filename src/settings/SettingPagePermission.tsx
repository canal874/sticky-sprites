/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';

export interface SettingPagePermissionProps {
  title: string;
}

export const SettingPagePermission = (props: SettingPagePermissionProps) => {
  return <h3>{props.title}</h3>;
};
