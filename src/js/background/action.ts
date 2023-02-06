/*
 *  Copyright 2023 qitoi
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

import { listenAuto } from '../libs/event-listen';
import * as prefs from '../libs/prefs';
import { getLocalizedText } from '../libs/localize';
import { ignoreRuntimeError } from '../libs/runtime-error';
import * as client from '../messages/client';
import { PopupWindow } from './popup-window';

const action = chrome.action || chrome.browserAction;
const actionContext = chrome.action ? 'action' : 'browser_action';

const CONTEXT_MENU_OPEN_ALBUM = 'context_menu_open_album';
const CONTEXT_MENU_OPEN_OPTION = 'context_menu_open_option';


export function setup(albumWindow: PopupWindow): void {
    setupIcon();
    setupContextMenu(albumWindow);
    setupIconClickEvent(albumWindow);
}


function setupIcon(): void {
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
}


function setupContextMenu(albumWindow: PopupWindow): void {
    // コンテキストメニューの設定
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

    listenAuto(chrome.contextMenus.onClicked, async info => {
        switch (info.menuItemId) {
            case CONTEXT_MENU_OPEN_ALBUM:
                await albumWindow.show();
                break;
            case CONTEXT_MENU_OPEN_OPTION:
                chrome.runtime.openOptionsPage();
                break;
        }
    });
}


function setupIconClickEvent(albumWindow: PopupWindow): void {
    // アルバムウィンドウの表示
    listenAuto(action.onClicked, async tab => {
        const p = await prefs.loadPreferences();
        switch (p.general.iconAction) {
            case prefs.ClickIconActions.OpenAlbum: {
                await albumWindow.show();
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
}
