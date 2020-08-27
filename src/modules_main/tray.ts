/**
 * @license Media Stickies
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import { app, Menu, MenuItemConstructorOptions, Tray } from 'electron';
import { openSettings, settingsDialog } from './settings';
import { getSettings, MESSAGE } from './store';
import { avatars, cards, createCard } from './card';
import { emitter } from './event';
import {
  CardAvatars,
  CardProp,
  CardPropSerializable,
  CardStyle,
  DEFAULT_CARD_GEOMETRY,
  Geometry,
  TransformableFeature,
} from '../modules_common/cardprop';
import { getRandomInt } from '../modules_common/utils';
import { cardColors, ColorName, darkenHexColor } from '../modules_common/color';
import {
  getCurrentWorkspaceId,
  getCurrentWorkspaceUrl,
  getNextWorkspaceId,
  setChangingToWorkspaceId,
  setLastWorkspaceId,
  Workspace,
  workspaces,
} from './store_workspaces';
import { CardIO } from './io';
import { loadCurrentWorkspace } from './workspace';

/**
 * Task tray
 */

// Ensure a reference to Tray object is retained, or it will be GC'ed.
let tray: Tray;
export const destroyTray = () => {
  if (tray !== undefined && !tray.isDestroyed()) {
    tray.destroy();
  }
};

let currentLanguage: string;
let color = { ...cardColors };
delete color.transparent;

const createNewCard = async () => {
  const geometry = { ...DEFAULT_CARD_GEOMETRY };
  geometry.x += getRandomInt(30, 100);
  geometry.y += getRandomInt(30, 100);

  let colorList = Object.entries(color);
  if (colorList.length === 0) {
    color = { ...cardColors };
    delete color.transparent;
    colorList = Object.entries(color);
  }
  const newColor: ColorName = colorList[getRandomInt(0, colorList.length)][0] as ColorName;
  delete color[newColor];

  const bgColor: string = cardColors[newColor];

  const newAvatars: CardAvatars = {};
  newAvatars[getCurrentWorkspaceUrl()] = new TransformableFeature(
    {
      x: geometry.x,
      y: geometry.y,
      z: geometry.z,
      width: geometry.width,
      height: geometry.height,
    },
    {
      uiColor: darkenHexColor(bgColor),
      backgroundColor: bgColor,
      opacity: 1.0,
      zoom: 1.0,
    }
  );

  const id = await createCard(
    CardProp.fromObject(({
      avatars: newAvatars,
    } as unknown) as CardPropSerializable)
  );
  const newAvatar = avatars.get(getCurrentWorkspaceUrl() + id);
  if (newAvatar) {
    newAvatar.window.focus();
  }
};

export const setTrayContextMenu = () => {
  if (!tray) {
    return;
  }
  const changeWorkspaces: MenuItemConstructorOptions[] = [...workspaces.keys()]
    .sort()
    .map(id => {
      return {
        label: `${workspaces.get(id)?.name}`,
        type: 'radio',
        checked: id === getCurrentWorkspaceId(),
        click: () => {
          if (id !== getCurrentWorkspaceId()) {
            const workspace = workspaces.get(id);
            if (!workspace) {
              return;
            }
            setChangingToWorkspaceId(id);
            avatars.forEach(avatar => avatar.window.webContents.send('card-close'));
            // wait 'window-all-closed' event
          }
        },
      };
    });
  if (changeWorkspaces.length > 0) {
    changeWorkspaces.unshift({
      type: 'separator',
    } as MenuItemConstructorOptions);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: MESSAGE('newCard'),
      click: () => {
        createNewCard();
      },
    },
    {
      type: 'separator',
    },
    {
      label: MESSAGE('workspaceNew'),
      click: async () => {
        const newId = getNextWorkspaceId();
        setLastWorkspaceId(newId);
        const workspace: Workspace = {
          name: `${MESSAGE('workspaceName', String(parseInt(newId, 10) + 1))}`,
          avatars: [],
        };
        workspaces.set(newId, workspace);
        await CardIO.createWorkspace(newId, workspace).catch((e: Error) =>
          console.error(e.message)
        );
        setTrayContextMenu();
        avatars.forEach(avatar => avatar.resetContextMenu());
      },
    },
    ...changeWorkspaces,
    {
      type: 'separator',
    },
    {
      label: MESSAGE('settings'),
      click: () => {
        openSettings();
      },
    },
    {
      label: MESSAGE('exit'),
      click: () => {
        if (settingsDialog && !settingsDialog.isDestroyed()) {
          settingsDialog.close();
        }
        avatars.forEach(avatar => avatar.window.webContents.send('card-close'));
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  let taskTrayToolTip = MESSAGE('trayToolTip');
  if (!app.isPackaged) {
    taskTrayToolTip += ' (Development)';
  }
  tray.setToolTip(taskTrayToolTip);
};

export const initializeTaskTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/media_stickies_grad_icon.ico'));
  currentLanguage = getSettings().persistent.language;
  setTrayContextMenu();
  tray.on('click', () => {
    createNewCard();
  });
};

emitter.on('updateTrayContextMenu', () => {
  const newLanguage = getSettings().persistent.language;
  if (currentLanguage !== newLanguage) {
    currentLanguage = newLanguage;
    setTrayContextMenu();
  }
});
