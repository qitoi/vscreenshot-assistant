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

import { CaptureParam, ImageDataUrl, VideoThumbnailParam } from '../types';
import Platform from '../platforms/platform';
import * as prefs from '../prefs';
import { downloadImage } from './download';


export function Setup(platform: Platform): void {
    prefs.watch().addEventListener(p => {
        bindHotkey(p.general.captureHotkey, platform);
    });
    prefs.loadPreferences().then(p => {
        bindHotkey(p.general.captureHotkey, platform);
    });
}

function bindHotkey(key: string, platform: Platform) {
    hotkeys.unbind();

    let pressed = false;
    hotkeys(key, { keyup: true }, (event, handler) => {
        if (!pressed && event.type === 'keydown') {
            pressed = true;
            exec(platform);
        }
        if (event.type === 'keyup') {
            pressed = false;
        }
    });
}


function exec(platform: Platform) {
    if (!platform.checkVideoPage()) {
        return;
    }
    return capture(platform);
}


let currentPlatform: Platform | null = null;
let currentVideoId: string | null = null;
let currentVideoInfo: any = null;

async function capture(platform: Platform) {
    const video = platform.getVideoElement();
    const pos = video.currentTime;
    const canvas = captureVideo(video);

    const p = await prefs.loadPreferences();

    const videoId = platform.getVideoId();
    let videoInfo = currentVideoInfo;

    if (videoId === null) {
        return;
    }

    if (currentPlatform !== platform || currentVideoId !== videoId) {
        videoInfo = await platform.initVideoInfo(videoId);
        currentPlatform = platform;
        currentVideoInfo = videoInfo;
        currentVideoId = videoId;
    }

    saveScreenshot(canvas, platform, videoId, videoInfo, pos, p);

    if (p.general.copyClipboard) {
        copyToClipboard(canvas);
    }
}

function captureVideo(image: CanvasImageSource): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    if (image instanceof HTMLVideoElement) {
        canvas.width = image.videoWidth;
        canvas.height = image.videoHeight;
    }
    else if (!(image instanceof SVGElement)) {
        canvas.width = image.width;
        canvas.height = image.height;
    }
    const ctx = canvas.getContext('2d');
    ctx!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function convertToDataURL(canvas: HTMLCanvasElement, p: prefs.Preferences): ImageDataUrl {
    return canvas.toDataURL(p.screenshot.fileType, (+p.screenshot.quality / 100));
}

function saveScreenshot(canvas: HTMLCanvasElement, platform: Platform, videoId: string, videoInfo: any, pos: number, p: prefs.Preferences) {
    const image = convertToDataURL(canvas, p);

    const param: CaptureParam = {
        type: 'capture',
        platform: platform.PLATFORM_ID,
        videoId: videoId,
        videoInfo: {
            title: platform.getVideoTitle(videoId, videoInfo),
            author: platform.getAuthor(videoId, videoInfo),
            date: platform.getVideoDate(videoId, videoInfo),
            ratio: canvas.width / canvas.height,
            private: platform.isPrivate(videoId, videoInfo),
        },
        pos: pos,
        datetime: (new Date()).getTime(),
        image: image,
    };

    chrome.runtime.sendMessage(param, async ({ existsVideoThumbnail, videoInfoParam }) => {
        if (!existsVideoThumbnail) {
            const thumbnail = await downloadImage(platform.getVideoThumbnailUrl(videoId, videoInfo));
            const param: VideoThumbnailParam = {
                type: 'video-thumbnail',
                videoInfo: videoInfoParam,
                thumbnail: thumbnail,
            };
            chrome.runtime.sendMessage(param);
        }
    });
}

async function copyToClipboard(canvas: HTMLCanvasElement): Promise<void> {
    canvas.toBlob(blob => {
        if (blob !== null) {
            // @ts-ignore
            const data = [new ClipboardItem({ [blob.type]: blob })];
            // @ts-ignore
            return navigator.clipboard.write(data);
        }
    }, 'image/png');
}
