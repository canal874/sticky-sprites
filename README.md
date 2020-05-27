# Media Stickies
A desktop gadget platform written by Electron.
You can write or paste any HTML on your desktop as a multimedia card.

It looks like a sticky note but accepts any HTML and can have a transparent background.

# Run

Type 'npm run compile-clean' on the project root directory.

'compile-clean' copies required files from html/ and 3rdParty/ to dist/ and compile .ts. 

After that you can type 'npm start' to start app.


# Build installer

Type 'npm run make' and you can find a installer which name is media-stickies-x.x.x.Setup.exe under out\make\squirrels.windows\x64\ (if you use Windows).

# Editor Type

2 editor types are available.

## WYSIWYG Editor

WYSIWYG editor has only one common mode for viewing and editing.
You can edit rich text directly on a card.

* HTML contents is rendered in a WYSIWYG editor.
* Text can be selected when a card is focused.
* An editor is always shown.
* An editor toobar is shown only when a card is focused.

## Markup Editor

Markup editor has two modes for viewing or editing.
You can edit markuped text on a built-in editor and view rendered HTML on a card.

* HTML contents is rendered in &lt;div id='contents'&gt;
* Text can be selected when a card is focused.
* An editor and its toolbar are shown only when &lt;div id='contents'&gt; is clicked.

## Event Trigger

| Event | WYSIWYG | Markup |
| :---: |  :---:  | :---:  |
| render-card | showEditor() | - |
| card-focused | startEdit() | - |
| click | - | showEditor()<br>startEdit() |
| card-blured | endEdit() | hideEditor()<br>endEdit() |
