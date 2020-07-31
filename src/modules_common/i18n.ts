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
  btnCloseCard: string;
  btnOK: string;
  btnCancel: string;
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
  languageDetailedText: string;
  currentLanguage: string;
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
  languageDetailedText:
    'Switch the Current Language list box to display the default language',
  currentLanguage: 'Current Language',
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
  btnCloseCard: 'Close',
  btnOK: 'OK',
  btnCancel: 'Cancel',
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
  languageDetailedText: 'このアプリのメニュー表示のために使用する言語を選んでください。',
  currentLanguage: '使用する言語',
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
  btnCloseCard: '閉じる',
  btnOK: 'はい',
  btnCancel: 'キャンセル',
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

let currentMessages: Messages = English;
let currentLanguage = 'en';
export const setCurrentMessages = (language: string, messages: Messages) => {
  currentLanguage = language;
  currentMessages = messages;
};
export const getCurrentMessages = () => {
  return [currentLanguage, currentMessages];
};
export const MESSAGE = (label: MessageLabel) => {
  return currentMessages[label];
};
