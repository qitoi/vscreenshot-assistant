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

import PopupWindow from './lib-background/popup-window';

const albumWindow = PopupWindow.create('album', 'album.html');

chrome.browserAction.onClicked.addListener(() => {
    albumWindow.show();
});


// screenshot

import {
    CaptureParam,
} from './lib/types';

import * as storage from './lib-background/storage';
import { createThumbnail } from './lib-background/thumbnail';


chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
    switch (param.event) {
        case 'capture': {
            const p = param as CaptureParam;
            Promise.all([
                createThumbnail(p.thumbnail, 320, 180),
                createThumbnail(p.image, 480, 270),
            ]).then(([videoThumb, screenshotThumb]) => {
                storage.saveScreenshot(p.platform, p.videoId, p.image, screenshotThumb, p.pos, p.datetime);
                storage.saveVideoInfo(p.platform, p.videoId, p.title, p.author, p.private, p.ratio, videoThumb, p.videoDate, p.datetime);
            });
            break;
        }
    }
    return true;
});
