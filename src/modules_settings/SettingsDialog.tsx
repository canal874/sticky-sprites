/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import React from 'react';

const e = React.createElement;

interface Props {}
interface State {
  liked: boolean;
}

export class SettingsDialog extends React.Component {
  state: State = { liked: false };
  constructor (props: Props) {
    super(props);
  }

  render () {
    if (this.state.liked) {
      return 'You liked this.';
    }
    return <button onClick={() => this.setState({ liked: true })}>Like</button>;
  }
}
