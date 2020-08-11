type MessagesMain = {
  exit: string;
  zoomIn: string;
  zoomOut: string;
  bringToFront: string;
  sendToBack: string;
  newCard: string;
  confirmClosing: string;
  confirmWaitMore: string;
  pleaseRestartErrorInOpeningEditor: string;
  securityPageNavigationAlert: string;
  securityLocalNavigationError: string;
  btnCloseCard: string;
  btnOK: string;
  btnAllow: string;
  btnCancel: string;
  btnRemove: string;
  settings: string;
  trayToolTip: string;
  white: string;
  yellow: string;
  red: string;
  green: string;
  blue: string;
  orange: string;
  purple: string;
  gray: string;
  transparent: string;
};

type MessagesSettings = {
  settingsDialog: string;
  settingPageLanguage: string;
  settingPageSecurity: string;
  settingPageSave: string;
  saveDetailedText: string;
  saveFilePath: string;
  saveChangeFilePathButton: string;
  chooseSaveFilePath: string;
  saveChangeFilePathAlert: string;
  saveChangeFilePathError: string;
  languageDetailedText: string;
  currentLanguage: string;
  selectableLanguages: string;
  securityDetailedText: string;
  securityNoUrl: string;
};

type MessagesLanguage = {
  en: string;
  ja: string;
};

export type Messages = MessagesMain & MessagesSettings & MessagesLanguage;

export type MessageLabel =
  | keyof MessagesMain
  | keyof MessagesSettings
  | keyof MessagesLanguage;

const LanguagesCommon: MessagesLanguage = {
  en: 'English',
  ja: '日本語(Japanese)',
};

const SettingsEnglish: MessagesSettings = {
  settingsDialog: 'Settings',
  settingPageLanguage: 'Language',
  settingPageSecurity: 'Security',
  settingPageSave: 'Data Save',
  saveDetailedText: 'Data is saved to the following location automatically:',
  saveFilePath: 'Save in the folder of',
  saveChangeFilePathButton: 'Change',
  chooseSaveFilePath: 'Select the place for saving data',
  saveChangeFilePathAlert:
    'Save data will be copied from the old folder to the new folder.\n(The data in the old folder is not removed.) \n[media_stickies_data] folder will be created in the new folder,\n  and save data is saved in this folder.',
  saveChangeFilePathError: 'Data cannot be copied here. Please select another location.',
  languageDetailedText: 'Select the Language in which you want this App to appear',
  currentLanguage: 'Current Language',
  selectableLanguages: 'Selectable Languages',
  securityDetailedText:
    'Only following websites are allowed to load into a card. Remove by clicking \u00D7 if not needed.',
  securityNoUrl: 'No URL allowed',
};
export const English: Messages = {
  ...LanguagesCommon,
  ...SettingsEnglish,
  exit: 'Exit',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  bringToFront: 'Bring to Front',
  sendToBack: 'Send to Back',
  newCard: 'New card',
  confirmClosing:
    'Close OK?\n\nThe card will be shown again when restating the app.\nIf you want to delete the card, let it empty before closing it.)',
  confirmWaitMore:
    'It takes a long time to save. Do you want to wait a little longer?\n\nIf you press Cancel, your changes will not be saved.',
  pleaseRestartErrorInOpeningEditor:
    'The card cannot be edited.\nPlease close this app and any other apps, and then open this app again.',
  securityPageNavigationAlert:
    'Trying to open external website $1. Allow if you think it is safe, otherwise it must be removed.',
  securityLocalNavigationError:
    'Script is trying to open $1, but it cannot be allowed. The card will be removed.',
  btnCloseCard: 'Close card',
  btnOK: 'OK',
  btnAllow: 'Allow',
  btnCancel: 'Cancel ', // 'Cancel' is automatically translated to local language, so add use 'Cancel '.
  btnRemove: 'Remove',
  settings: 'Settings...',
  trayToolTip: 'Media Stickies',
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

const SettingsJapanese: MessagesSettings = {
  settingsDialog: '設定',
  settingPageLanguage: '言語',
  settingPageSecurity: 'セキュリティ',
  settingPageSave: 'データ保存先',
  saveDetailedText: 'データは次の場所へ自動的に保存されます。',
  saveFilePath: 'このフォルダに保存',
  saveChangeFilePathButton: '変更',
  chooseSaveFilePath: 'データの保存先を選んでください',
  saveChangeFilePathAlert:
    'データは新しい保存先へコピーされます（元の保存先からは削除されません）\n保存先には「media_stickies_data」という名前のフォルダが作成され、\nデータはこのフォルダの中に保存されます。',
  saveChangeFilePathError: 'データをコピーできませんでした。他の保存先を選んでください。',
  languageDetailedText: 'このアプリのメニュー表示のために使用する言語を選んでください。',
  currentLanguage: '使用中の言語',
  selectableLanguages: '選択可能な言語',
  securityDetailedText:
    '次のドメインのサイトのみカードに読み込むことができます。不要なサイトは×ボタンを押して削除してください。',
  securityNoUrl: '許可されたサイトはありません',
};
export const Japanese: Messages = {
  ...LanguagesCommon,
  ...SettingsJapanese,
  exit: '終了',
  zoomIn: '拡大',
  zoomOut: '縮小',
  bringToFront: '最前面へ',
  sendToBack: '最背面へ',
  newCard: '新規カード',
  confirmClosing:
    'カードを閉じても良いですか？\n\n閉じたカードはアプリ再起動でまた表示されます。\n削除したい場合、カードの内容を全て消してから閉じてください）',
  confirmWaitMore:
    '保存に時間が掛かっています。もう少し待ちますか？\n\nキャンセルを押すと、変更した内容は保存されない場合があります。',
  pleaseRestartErrorInOpeningEditor:
    'カードを編集できません。\n本アプリと他のアプリを全て閉じた後、本アプリをもう一度開いてください。',
  securityPageNavigationAlert:
    '外部サイト $1 を開こうとしています。安全な場合のみ許可してください。\n許可しない場合、このカードは削除されます。',
  securityLocalNavigationError:
    'スクリプトが $1 を開こうとしていますが、許可できません。このカードを削除します。',
  btnCloseCard: 'カードを閉じる',
  btnOK: 'はい',
  btnAllow: '許可する',
  btnCancel: 'キャンセル',
  btnRemove: '削除する',
  settings: '設定...',
  trayToolTip: 'Media Stickies',
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

export const availableLanguages = ['en', 'ja'];
export const defaultLanguage = 'en';
