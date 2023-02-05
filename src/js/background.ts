/*
 *  Copyright 2021 qitoi
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { patternToRegex } from 'webext-patterns';

import * as prefs from './libs/prefs';
import { getLocalizedText } from './libs/localize';
import { listenAuto } from './libs/event-listen';
import { ignoreRuntimeError } from "./libs/runtime-error";
import * as popup from './background/popup-window';
import { MessageServer, PortServer } from "./messages/server";
import { AnimeCaptureServer, CaptureServer } from "./messages/capture/server";
import { KeepAliveServer } from "./messages/keep-alive/server";
import { AlbumServer } from "./messages/album/server";
import { SnsShareServer } from "./messages/sns-share/server";
import * as client from "./messages/client";


const action = chrome.action || chrome.browserAction;
const actionContext = chrome.action ? 'action' : 'browser_action';


prefs.watch();
popup.watch();

// アルバムウィンドウの作成・表示

const albumWindow = popup.PopupWindow.create('album', 'album.html', true);
listenAuto(action.onClicked, async tab => {
    const p = await prefs.loadPreferences();
    switch (p.general.iconAction) {
        case prefs.ClickIconActions.OpenAlbum: {
            albumWindow.show();
            break;
        }
        case prefs.ClickIconActions.CaptureScreenshot: {
            if (tab.id !== undefined) {
                try {
                    await client.sendTabMessage(tab.id, 'tab-capture-request', {})
                }
                catch {
                    // 対象外のページにメッセージを送ると受信側がなくてエラーになるため握り潰す
                }
            }
        }
    }
});


// コンテキストメニューの設定
const CONTEXT_MENU_OPEN_ALBUM = 'context_menu_open_album';
const CONTEXT_MENU_OPEN_OPTION = 'context_menu_open_option';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(
        {
            id: CONTEXT_MENU_OPEN_ALBUM,
            type: 'normal',
            contexts: [actionContext],
            title: getLocalizedText(CONTEXT_MENU_OPEN_ALBUM),
        },
        ignoreRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: CONTEXT_MENU_OPEN_OPTION,
            type: 'normal',
            contexts: [actionContext],
            title: getLocalizedText(CONTEXT_MENU_OPEN_OPTION),
        },
        ignoreRuntimeError
    );
});

listenAuto(chrome.contextMenus.onClicked, (info, tab) => {
    switch (info.menuItemId) {
        case CONTEXT_MENU_OPEN_ALBUM:
            albumWindow.show();
            break;
        case CONTEXT_MENU_OPEN_OPTION:
            chrome.runtime.openOptionsPage();
            break;
    }
});


// ページのロード時にアイコンを切り替え

const manifest = chrome.runtime.getManifest();
const urls = manifest.content_scripts?.filter(c => !c.js?.includes('js/contents-twitter.js'))?.map(c => c.matches ?? []).flat() ?? [];
const patterns = patternToRegex(...urls);
listenAuto(chrome.webNavigation.onCommitted, details => {
    if (details.frameId !== 0) {
        return;
    }
    if (patterns.test(details.url)) {
        action.setIcon(
            {
                tabId: details.tabId,
                path: {
                    16: chrome.runtime.getURL('img/icon-16.png'),
                    24: chrome.runtime.getURL('img/icon-24.png'),
                    32: chrome.runtime.getURL('img/icon-32.png')
                },
            },
            ignoreRuntimeError
        );
    }
    else {
        action.setIcon(
            {
                tabId: details.tabId,
                path: {
                    16: chrome.runtime.getURL('img/icon-16-disabled.png'),
                    24: chrome.runtime.getURL('img/icon-24-disabled.png'),
                    32: chrome.runtime.getURL('img/icon-32-disabled.png')
                },
            },
            ignoreRuntimeError
        );
    }
});

// メッセージサーバの設定
new MessageServer()
    .bind(CaptureServer)
    .bind(AlbumServer)
    .bind(SnsShareServer)
    .listen();

new PortServer()
    .bind(AnimeCaptureServer)
    .bind(KeepAliveServer)
    .listen();
