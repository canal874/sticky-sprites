import { translate } from 'typed-intl';

export interface Messages {
  confirmClosing: string;
  confirmWaitMore: string;
  pleaseRestartErrorInOpeningCard: string;
  btnCloseCard: string;
  btnCancel: string;
  white: string;
  yellow: string;
  red: string;
  green: string;
  blue: string;
  orange: string;
  purple: string;
  gray: string;
  transparent: string;
}

const English: Messages = {
  confirmClosing:
    'Close OK?\n(The card will be shown again when restating the app. If you want to delete the card, let it empty before closing it.)',
  confirmWaitMore:
    'It takes a long time to save. Do you want to wait a little longer?\nIf you press Cancel, your changes will not be saved.',
  pleaseRestartErrorInOpeningCard:
    'The card cannot be opened.\nPlease close this app and any other apps, and then open this app again.',
  btnCloseCard: 'Close',
  btnCancel: 'Cancel',
  white: 'white',
  yellow: 'yellow',
  red: 'red',
  green: 'green',
  blue: 'blue',
  orange: 'orange',
  purple: 'purple',
  gray: 'gray',
  transparent: 'transparent',
};

const Japanese: Messages = {
  confirmClosing:
    'カードを閉じても良いですか？\n（閉じたカードはアプリ再起動でまた表示されます。削除したい場合、カードの内容を全て消してから閉じてください）',
  confirmWaitMore:
    '保存に時間が掛かっています。もう少し待ちますか？\nキャンセルを押すと、変更した内容は保存されない場合があります。',
  pleaseRestartErrorInOpeningCard:
    'カードを開くことができませんでした。\n本アプリと他のアプリを全て閉じた後、本アプリをもう一度開いてください。',
  btnCloseCard: '閉じる',
  btnCancel: 'キャンセル',
  white: '白',
  yellow: '黄',
  red: '赤',
  green: '緑',
  blue: '青',
  orange: 'オレンジ',
  purple: '紫',
  gray: 'グレー',
  transparent: '透明',
};

export default translate(English).supporting('ja', Japanese);
