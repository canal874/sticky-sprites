# Media Stickies
A desktop gadget platform written by Electron.
You can write or paste any HTML on you desktop as a gadget.

This looks like sticky notes but accepts any HTML and can have a transparent background.

# Run

Just type 'npm run cleanstart' on the project root directory.

'cleanstart' copies required files from html/ to dist/ and starts app. 
After that you can type 'npm start' to start app.


# Build installer

Type 'npm run make' and you can find a installer which name is media-stickies-x.x.x.Setup.exe under out\make\squirrels.windows\x64\ (if you use Windows).

# Options

Set environment variables to change runtime options.

(Linux shell) VARIABLE_NAME=VALUE npm start

(Windows command prompt) set VARIABLE_NAME=VALUE & npm start

(Windows PowerShell）$env:VARIABLE_NAME="VALUE"; npm start

## Variables

### NODE_CARDDIR

PATH to the place where cards are saved.

Default value is ./cards

Welcome to the media-stickies wiki!


# Editor Type

2 editor types are available.

## WYSIWYG

WYSIWYG editor has only one common mode for viewing and editing.
You can edit rich text directly on a sticky.

* HTML is rendered on a WYSIWYG editor.
* Text can be selected when a card is focused.
* An editor is always shown.
* An editor toobar is shown only when a card is focused.

## Markup

Markup editor has two mode for viewing or editing.
You can edit markuped text on a built-in editor and view rendered HTML on a sticky.

* HTML is rendered on &lt;div id='contents'&gt;
* Text can be selected when a card is focused.
* An editor and its toolbar are shown only when #contents is clicked.

## Event Trigger

| Event | WYSIWYG | Markup |
| :---: |  :---:  | :---:  |
| render-card | showEditor() | - |
| card-focused | startEdit() | - |
| click | - | showEditor()<br>startEdit() |
| card-blured | endEdit() | hideEditor()<br>endEdit() |
