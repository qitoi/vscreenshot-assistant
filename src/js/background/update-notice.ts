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


import * as prefs from "../libs/prefs";


export function setup() {
    const watch = prefs.watch();

    // 拡張機能の更新時にバッジを表示、バッジクリック時に更新内容を表示
    chrome.runtime.onInstalled.addListener(async (detail) => {
        if (detail.reason === 'update') {
            const p = await prefs.loadPreferences();
            if (p.general.notifyUpdates) {
                await enableUpdateNotice();
            }
        }
    });

    // 設定の変更監視
    watch.addListener(async (p) => {
        // 更新通知の設定が無効化された場合、バッジ表示、更新情報表示を解除
        if (!p.general.notifyUpdates) {
            await disableUpdateNotice();
        }
    });
}

// バッジクリック時に更新内容を表示
const callback = async () => {
    chrome.action.onClicked.removeListener(callback);
    await Promise.all([
        chrome.action.setBadgeText({ text: '' }),
        chrome.tabs.create({
            url: chrome.runtime.getURL('options.html#changelog'),
        }),
    ]);
};

async function enableUpdateNotice() {
    await Promise.all([
        chrome.action.setBadgeBackgroundColor({
            color: '#ff5555',
        }),
        chrome.action.setBadgeTextColor({
            color: '#ffffff',
        }),
        chrome.action.setBadgeText({ text: 'NEW' }),
    ]);
    chrome.action.onClicked.addListener(callback);
}

async function disableUpdateNotice() {
    chrome.action.onClicked.removeListener(callback);
    await chrome.action.setBadgeText({ text: '' });
}
