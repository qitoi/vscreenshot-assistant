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

// album window

import PopupWindow from './lib/background/popup-window';
import { ImageDataUrl, VideoInfo } from './lib/types';
import * as messages from './lib/messages';
import * as port from './lib/port';
import * as storage from './lib/storage';
import * as prefs from './lib/prefs';
import { loadPreferences } from './lib/prefs';
import { createThumbnail } from './lib/background/thumbnail';
import { makeAnimation } from './lib/background/animation';


const albumWindow = PopupWindow.create('album', 'album.html');

chrome.browserAction.onClicked.addListener(() => {
    albumWindow.show();
});


prefs.watch();

// スクリーンショットキャプチャやスクリーンショット削除メッセージ対応

chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
    const message = param as messages.MessageRequest;
    switch (message.type) {
        case 'capture': {
            // スクリーンショットのサムネイル作成
            const thumbnail = prefs.loadPreferences().then(prefs => {
                return createThumbnail(message.image, prefs.thumbnail.width, prefs.thumbnail.height);
            });
            const image = Promise.resolve(message.image);

            saveScreenshot(message, false, image, thumbnail)
                .then(({ existsVideoThumbnail, videoInfo }) => {
                    const response: (message: messages.CaptureResponse) => void = sendResponse;
                    if (existsVideoThumbnail) {
                        response({
                            type: 'capture-response',
                            status: 'complete',
                        });
                    }
                    else {
                        response({
                            type: 'capture-response',
                            status: 'video-thumbnail',
                            videoInfo,
                        });
                    }
                });

            break;
        }
        case 'video-thumbnail': {
            storage.saveVideoThumbnail(message.videoInfo.platform, message.videoInfo.videoId, message.thumbnail);
            storage.saveVideoInfo({ ...message.videoInfo, lastUpdated: Date.now() });
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
                    animeCapture.thumbnail = loadPreferences().then(prefs => createThumbnail(message.image, prefs.thumbnail.width, prefs.thumbnail.height));
                }
                animeCapture.frames.push(
                    createThumbnail(message.image, animeCapture.width, animeCapture.height)
                        .then((resize): AnimeFrame => ({
                            no: message.no,
                            image: resize,
                        }))
                );
                break;
            }
            case 'anime-end': {
                const thumbnail = animeCapture.thumbnail;
                if (thumbnail === null) {
                    message.sendResponse({ type: 'anime-end-response', status: 'error', error: 'invalid' });
                    break;
                }

                const image = Promise.all(animeCapture.frames).then(frames =>
                    makeAnimation(frames.sort((a, b) => a.no - b.no).map(f => f.image), message.interval, progress => {
                        if (!port.disconnected) {
                            port.sendMessage({
                                type: 'anime-encode-progress',
                                progress,
                            });
                        }
                    })
                );

                saveScreenshot(message, true, image, thumbnail)
                    .then(({ existsVideoThumbnail, videoInfo }) => {
                        if (existsVideoThumbnail) {
                            message.sendResponse({
                                type: 'anime-end-response',
                                status: 'complete',
                            });
                        }
                        else {
                            message.sendResponse({
                                type: 'anime-end-response',
                                status: 'video-thumbnail',
                                videoInfo,
                            });
                        }
                    });
                break;
            }
        }
    });
});


function saveScreenshot(param: messages.CaptureRequestBase, isAnime: boolean, image: Promise<ImageDataUrl>, thumbnail: Promise<ImageDataUrl>): Promise<{ existsVideoThumbnail: boolean, videoInfo: VideoInfo }> {
    const videoInfo: VideoInfo = {
        ...param.videoInfo,
        platform: param.platform,
        videoId: param.videoId,
        lastUpdated: param.datetime,
    };

    return Promise.all([
        image,
        thumbnail,
    ])
        .then(([image, thumbnail]) => Promise.all([
            image,
            thumbnail,
            storage.existsVideoThumbnail(param.platform, param.videoId)
        ]))
        .then(([image, thumbnail, existsVideoThumbnail]) => {
            storage.saveScreenshot(param.platform, param.videoId, isAnime, param.pos, param.datetime, image, thumbnail);
            if (existsVideoThumbnail) {
                storage.saveVideoInfo({ ...videoInfo, lastUpdated: Date.now() });
            }
            return { existsVideoThumbnail, videoInfo };
        });
}


async function clearAllScreenshot(): Promise<void> {
    const p = await prefs.loadPreferences();
    const windowSizeSet = await PopupWindow.loadWindowSizeSet();
    await storage.clearAll();
    await prefs.savePreferences(p);
    await PopupWindow.saveWindowSizeSet(windowSizeSet);
}
