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
import { CaptureParam, VideoInfo, VideoThumbnailParam, } from './lib/types';

import * as storage from './lib/background/storage';
import { createThumbnail } from './lib/background/thumbnail';
import { loadPreferences } from './lib/background/preferences';


const albumWindow = PopupWindow.create('album', 'album.html');

chrome.browserAction.onClicked.addListener(() => {
    albumWindow.show();
});


// screenshot

chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
    switch (param.type) {
        case 'capture': {
            const p = param as CaptureParam;
            const videoInfo: VideoInfo = {
                platform: p.platform,
                videoId: p.videoId,
                lastUpdated: p.datetime,
                ...p.videoInfo,
            };
            // ビデオのサムネイル存在チェック
            const existsThumbnail =
                storage.existsVideoThumbnail(p.platform, p.videoId)
                    .then(exists => {
                        sendResponse({ existsVideoThumbnail: exists, videoInfoParam: videoInfo });
                        return exists;
                    });

            // スクリーンショットのサムネイル作成
            const createScreenshotThumbnail =
                loadPreferences().then(preferences => {
                    return createThumbnail(p.image, preferences.thumbnail.width, preferences.thumbnail.height);
                });

            Promise.all([
                existsThumbnail,
                createScreenshotThumbnail,
            ]).then(([existsVideoThumbnail, thumbnail]) => {
                storage.saveScreenshot(p.platform, p.videoId, p.pos, p.datetime, p.image, thumbnail);
                if (existsVideoThumbnail) {
                    storage.saveVideoInfo(videoInfo);
                }
            });
            break;
        }
        case 'video-thumbnail': {
            const p = param as VideoThumbnailParam;
            storage.saveVideoThumbnail(p.videoInfo.platform, p.videoInfo.videoId, p.thumbnail);
            storage.saveVideoInfo(p.videoInfo);
            break;
        }
    }
    return true;
});
