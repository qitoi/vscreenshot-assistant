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

import hotkeys from 'hotkeys-js';

import { CaptureParam } from './lib/types';
import capture from './lib/capture';
import { downloadImage } from './lib-contents/download';

function getVideoInfo(): any {
    return JSON.parse((document.querySelector('script#scriptTag') as HTMLElement)?.innerText);
}

function getVideoDate(info: any): number {
    let dateStr = null;
    if ('publication' in info) {
        // live streaming / live streaming archive / premiere video
        dateStr = (info.publication || [])[0]?.startDate;
    }
    else {
        // uploaded video
        dateStr = (document.querySelector('div#date>yt-formatted-string') as HTMLElement)?.innerText;
        // member only
        if (dateStr === void 0) {
            dateStr = (document.querySelector('div#info-strings>yt-formatted-string') as HTMLElement)?.innerText;
        }
    }
    return (dateStr !== null) ? (new Date(dateStr)).getTime() : null;
}

function getVideoThumbnail(info: any): string {
    return (info?.thumbnailUrl ?? [])[0] ?? null;
}

function getVideoTitle(info: any): string {
    return info?.name;
}

function getVideoChannelName(info: any): string {
    return info?.author;
}

function isPrivate(): boolean {
    const label = (document.querySelector('ytd-video-primary-info-renderer .ytd-badge-supported-renderer > span') as HTMLElement)?.innerText;
    return label !== void 0;
}

let pressed = false;
hotkeys('alt+s', { keyup: true }, (event, handler) => {
    if (!pressed && event.type === 'keydown') {
        pressed = true;
        exec();
    }
    if (event.type === 'keyup') {
        pressed = false;
    }
});

function exec(): void {
    if (!checkPage()) {
        return;
    }

    const videoId = getVideoID(location.search);
    const info = getVideoInfo();

    const video = document.querySelector('video.video-stream') as HTMLVideoElement;
    const image = capture(video, 'image/jpeg', 0.98);

    downloadImage(getVideoThumbnail(info))
        .then(thumbnail => {
            const param: CaptureParam = {
                event: 'capture',
                platform: 'youtube',
                videoId: videoId,
                title: getVideoTitle(info),
                author: getVideoChannelName(info),
                private: isPrivate(),
                ratio: video.videoHeight / video.videoWidth,
                thumbnail: thumbnail,
                videoDate: getVideoDate(info),
                image: image,
                pos: video.currentTime,
                datetime: (new Date()).getTime(),
            };
            chrome.runtime.sendMessage(param);
        });
}

function checkPage(): boolean {
    return location.pathname === '/watch';
}

function getVideoID(query: string): string {
    const params = new URLSearchParams(query);
    return params.get('v');
}
