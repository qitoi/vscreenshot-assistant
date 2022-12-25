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

import { ImageDataUrl, VideoInfo } from './libs/types';
import * as messages from './libs/messages';
import * as port from './libs/port';
import * as storage from './libs/storage';
import * as prefs from './libs/prefs';
import { downloadImage } from './libs/download';
import { getLocalizedText } from './libs/localize';
import { listenAuto } from './libs/event-listen';
import * as popup from './background/popup-window';
import * as videoSort from './background/video-sort';
import * as screenshotSort from './background/screenshot-sort';
import { resizeImage } from './background/resize';
import { makeAnimation } from './background/animation';
import { shareScreenshot } from './background/share-twitter';


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
                chrome.tabs.sendMessage(tab.id, { type: 'capture-screenshot' })
                    .catch(() => {
                        // 対応ページ以外でキャプチャメッセージを送るとエラーが出るので握り潰す
                    });
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
        }
    );
    chrome.contextMenus.create(
        {
            id: CONTEXT_MENU_OPEN_OPTION,
            type: 'normal',
            contexts: [actionContext],
            title: getLocalizedText(CONTEXT_MENU_OPEN_OPTION),
        }
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
        action.setIcon({
            tabId: details.tabId,
            path: {
                16: chrome.runtime.getURL('img/icon-16.png'),
                24: chrome.runtime.getURL('img/icon-24.png'),
                32: chrome.runtime.getURL('img/icon-32.png')
            },
        });
    }
    else {
        action.setIcon({
            tabId: details.tabId,
            path: {
                16: chrome.runtime.getURL('img/icon-16-disabled.png'),
                24: chrome.runtime.getURL('img/icon-24-disabled.png'),
                32: chrome.runtime.getURL('img/icon-32-disabled.png')
            },
        });
    }
});


// スクリーンショットキャプチャやスクリーンショット削除メッセージ対応

listenAuto(chrome.runtime.onMessage, (param, sender, sendResponse) => {
    const message = param as messages.MessageRequest;
    switch (message.type) {
        case 'capture': {
            // スクリーンショットのサムネイル作成
            const image = Promise.resolve(message.image);

            saveScreenshot(message, false, image, image)
                .then(() => {
                    const response: (message: messages.CaptureResponse) => void = sendResponse;
                    response({
                        type: 'capture-response',
                        status: 'complete',
                    });
                });

            break;
        }
        case 'remove-video': {
            const response: (message: messages.RemoveVideoResponse) => void = sendResponse;
            storage.removeVideoInfo(message.platform, message.videoId)
                .then(() => {
                    response({ type: 'remove-video-response', status: 'complete' });
                });
            break;
        }
        case 'reset-storage': {
            const response: (message: messages.ResetStorageResponse) => void = sendResponse;
            clearAllScreenshot()
                .then(() => {
                    response({ type: 'reset-storage-response', status: 'complete' });
                });
            break;
        }
        case 'share-screenshot': {
            shareScreenshot(message.video, message.screenshots, message.hashtags);
            sendResponse();
            break;
        }
    }
    return true;
});


// アニメーションキャプチャのメッセージ対応

type AnimeFrame = {
    no: number,
    image: ImageDataUrl,
}

type AnimeCapture = {
    thumbnail: Promise<ImageDataUrl> | null,
    frames: Promise<AnimeFrame>[],
    width: number,
    height: number,
};

const ANIME_CAPTURE_ID_PREFIX = 'anime-capture:';

port.listenPort().addListener(port => {
    if (!port.name.startsWith(ANIME_CAPTURE_ID_PREFIX)) {
        port.disconnect();
        return;
    }

    port.onDisconnect.addListener(() => {
        animeCapture.thumbnail = null;
        animeCapture.frames = [];
    });

    const animeCapture: AnimeCapture = {
        thumbnail: null,
        frames: [],
        width: 0,
        height: 0,
    };

    prefs.loadPreferences().then(prefs => {
        animeCapture.width = prefs.animation.width;
        animeCapture.height = prefs.animation.height;
    });

    port.onMessage.addListener(message => {
        switch (message.type) {
            case 'anime-frame': {
                if (animeCapture.thumbnail === null) {
                    animeCapture.thumbnail = Promise.resolve(message.image);
                }

                const resize = resizeImage(message.image, animeCapture.width, animeCapture.height, 'image/png')
                    .then((resize): AnimeFrame => ({
                        no: message.no,
                        image: resize,
                    }));

                resize.then(() => message.sendResponse({ type: 'anime-frame-response', status: 'complete' }));
                animeCapture.frames.push(resize);
                break;
            }
            case 'anime-end': {
                const thumbnail = animeCapture.thumbnail;
                if (thumbnail === null) {
                    message.sendResponse({ type: 'anime-end-response', status: 'error', error: 'invalid' });
                    break;
                }

                const image = Promise.all(animeCapture.frames).then(frames =>
                    makeAnimation(
                        frames.sort((a, b) => a.no - b.no).map(f => f.image),
                        message.interval,
                        progress => {
                            if (!port.disconnected) {
                                port.sendMessage({
                                    type: 'anime-encode-progress',
                                    progress,
                                });
                            }
                        })
                );

                saveScreenshot(message, true, image, thumbnail)
                    .then(() => {
                        message.sendResponse({
                            type: 'anime-end-response',
                            status: 'complete',
                        });
                    });
                break;
            }
        }
    });
});


async function saveScreenshot(param: messages.CaptureRequestBase, isAnime: boolean, image: Promise<ImageDataUrl>, imageForThumbnail: Promise<ImageDataUrl>): Promise<void> {
    const thumbnailQuality = 94;
    const p = await prefs.loadPreferences();
    const videoInfo: VideoInfo = {
        ...param.videoInfo,
        platform: param.platform,
        videoId: param.videoId,
        lastUpdated: param.datetime,
    };

    // スクリーンショットのサムネイル作成
    const thumbnail: Promise<ImageDataUrl> = imageForThumbnail.then(image => resizeImage(image, p.thumbnail.width, p.thumbnail.height, 'image/jpeg', thumbnailQuality));

    // 動画サムネイルが保存されていない場合はダウンロードする
    type VideoThumbnail = { image: ImageDataUrl, resized: ImageDataUrl };
    let videoThumbnail: Promise<VideoThumbnail | null> = Promise.resolve(null);
    const videoThumbnailExists = await storage.existsVideoThumbnail(param.platform, param.videoId);
    if (!videoThumbnailExists) {
        const download = (param.thumbnailUrl !== null) ? downloadImage(param.thumbnailUrl, true) : Promise.reject();
        videoThumbnail =
            download
                .then(async image => ({
                    image,
                    resized: await resizeImage(image, p.thumbnail.width, p.thumbnail.height, 'image/jpeg', thumbnailQuality),
                }))
                // サムネイルのURLが取得できない場合やサムネイルのダウンロードに失敗した場合、キャプチャ画像用のサムネイル画像で代用
                .catch(async () => ({
                    image: await imageForThumbnail,
                    resized: await thumbnail,
                }));
    }

    return Promise.all([image, thumbnail, videoThumbnail])
        .then(([image, thumbnail, videoThumbnail]) => {
            storage.saveScreenshot(param.platform, param.videoId, isAnime, param.pos, param.datetime, image, thumbnail);
            // 新規保存する動画サムネイルがある場合は保存
            if (videoThumbnail !== null) {
                storage.saveVideoThumbnail(param.platform, param.videoId, videoThumbnail.image, videoThumbnail.resized);
            }
            storage.saveVideoInfo({ ...videoInfo, lastUpdated: Date.now() });
        });
}


async function clearAllScreenshot(): Promise<void> {
    // スクリーンショット以外の設定を退避
    const p = await prefs.loadPreferences();
    const windowSizeSet = await popup.loadWindowSizeSet();
    const videoSortOrder = await videoSort.loadVideoSortOrder();
    const screenshotSortOrder = await screenshotSort.loadScreenshotSortOrder();

    await storage.clearAll();

    // 復元
    await prefs.savePreferences(p);
    await popup.saveWindowSizeSet(windowSizeSet);
    await videoSort.saveVideoSortOrder(videoSortOrder);
    await screenshotSort.saveScreenshotSortOrder(screenshotSortOrder);
}
