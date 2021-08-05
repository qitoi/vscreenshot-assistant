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
import { CaptureMessageBase, ImageDataUrl, MessageType, VideoInfo } from './lib/types';

import * as storage from './lib/storage';
import * as prefs from './lib/prefs';
import { createThumbnail } from './lib/background/thumbnail';
import { makeAnimation } from './lib/background/animation';


const albumWindow = PopupWindow.create('album', 'album.html');

chrome.browserAction.onClicked.addListener(() => {
    albumWindow.show();
});


prefs.watch();

// screenshot

chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
    switch ((param as MessageType).type) {
        case 'capture': {
            // スクリーンショットのサムネイル作成
            const thumbnail = () =>
                prefs.loadPreferences().then(prefs => {
                    return createThumbnail(param.image, prefs.thumbnail.width, prefs.thumbnail.height);
                });
            const image = () => Promise.resolve(param.image);

            capture(param, image, thumbnail, sendResponse);

            break;
        }
        case 'video-thumbnail': {
            storage.saveVideoThumbnail(param.videoInfo.platform, param.videoInfo.videoId, param.thumbnail);
            storage.saveVideoInfo({ ...param.videoInfo, lastUpdated: Date.now() });
            break;
        }
        case 'animation': {
            const thumbnail = () =>
                prefs.loadPreferences().then(prefs => {
                    return createThumbnail(param.images[0], prefs.thumbnail.width, prefs.thumbnail.height);
                });
            const image = () => convertAnimation(param.images, param.interval);

            capture(param, image, thumbnail, sendResponse);

            break;
        }
    }
    return true;
});

function capture(param: CaptureMessageBase, image: () => Promise<ImageDataUrl>, thumbnail: () => Promise<ImageDataUrl>, sendResponse: (response?: any) => void): void {
    const videoInfo: VideoInfo = {
        platform: param.platform,
        videoId: param.videoId,
        lastUpdated: param.datetime,
        ...param.videoInfo,
    };

    Promise.all([
        image(),
        thumbnail(),
    ])
        .then(([image, thumbnail]) => Promise.all([
            image,
            thumbnail,
            storage.existsVideoThumbnail(param.platform, param.videoId)
        ]))
        .then(([image, thumbnail, existsVideoThumbnail]) => {
            storage.saveScreenshot(param.platform, param.videoId, param.pos, param.datetime, image, thumbnail);
            if (existsVideoThumbnail) {
                storage.saveVideoInfo({ ...videoInfo, lastUpdated: Date.now() });
            }
            sendResponse({ existsVideoThumbnail, videoInfoParam: videoInfo });
        });
}

async function convertAnimation(images: string[], interval: number): Promise<ImageDataUrl> {
    const p = await prefs.loadPreferences();
    return makeAnimation(images, p.animation.width, p.animation.height, interval);
}
