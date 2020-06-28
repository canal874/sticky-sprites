<img alt="Media Stickies" src="https://github.com/canal874/media-stickies/blob/master/assets/madia-stickies-grad-icon-128x128.png" width=80 height=80 align="left"> 

# Media Stickies

A desktop gadget platform written by Electron.
You can write or paste any HTML on your desktop as a multimedia card.

It looks like a sticky note but accepts any HTML and can have a transparent background.

# Run

Type 'npm run compile-clean' on the project root directory.

'compile-clean' copies required files from assets, html/ and 3rdParty/ to dist/ and compile .ts. 

After that you can type 'npm start' to start app.


# Build installer

Type 'npm run make' to build an installer. You can find the installer which name is media_stickies-x.x.x.Setup.exe under out\make\squirrels.windows\x64\ (if you use Windows).

Card data is saved under 

C:\Users\%USERNAME%\AppData\Local\media_stickies_data\

