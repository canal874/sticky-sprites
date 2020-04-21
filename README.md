# Media Stickies
A desktop gadget platform written by Electron.
You can write or paste any HTML on you desktop as a gadget.

This looks like sticky notes but accepts any HTML and can have a transparent background.

# Install and Usage
Currently no installer. 

Just type 'npx electron .' on the project root directory.

# Options

Set environment variables to change runtime options.

(Linux shell) VARIABLE_NAME=VALUE npx electron .

(Windows command prompt) set VARIABLE_NAME=VALUE & npx electron .

(Windows PowerShell）$env:VARIABLE_NAME="VALUE"; npx electron .

## Variables

### NODE_LIBPATH

PATH to library.

Default value is ./modules

### NODE_CARDDIR

PATH to the place where cards are saved.

Default value is ./cards