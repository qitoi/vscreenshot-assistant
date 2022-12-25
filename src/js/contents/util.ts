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

import { ImageDataUrl } from '../libs/types';
import * as messages from '../libs/messages';
import { MessageRequest, MessageResponse } from '../libs/messages';
import * as prefs from '../libs/prefs';
import { Platform, PlatformVideoInfo } from '../platforms/platform';


let currentPlatform: Platform | null = null;
let currentVideoId: string | null = null;
let currentVideoInfo: PlatformVideoInfo | null = null;

export async function getVideoInfo(platform: Platform): Promise<{ videoId: string, videoInfo: any }> {
    const videoId = platform.getVideoId();
    let videoInfo = currentVideoInfo;

    if (videoId === null) {
        return Promise.reject();
    }

    if (currentPlatform !== platform || currentVideoId !== videoId) {
        videoInfo = await platform.getVideoInfo(videoId);
        currentPlatform = platform;
        currentVideoInfo = videoInfo;
        currentVideoId = videoId;
    }

    return { videoId, videoInfo };
}


export function captureVideo(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return canvas;
}


export function convertToDataURL(canvas: HTMLCanvasElement, prefs: prefs.Preferences): ImageDataUrl {
    return canvas.toDataURL(prefs.screenshot.fileType, (+prefs.screenshot.quality / 100));
}

type MessageSender = {
    sendMessage: (req: MessageRequest, callback: (res: MessageResponse) => void) => void,
};

export function saveScreenshot(platform: Platform, videoId: string, videoInfo: PlatformVideoInfo, pos: number, ratio: number, param: messages.CaptureRequestAdditionalType, sender: MessageSender): Promise<void> {
    const captureParam: messages.CaptureMessageRequest = {
        ...param,
        platform: platform.PLATFORM_ID,
        videoId: videoId,
        videoInfo: {
            title: videoInfo.title,
            author: videoInfo.author,
            hashtags: videoInfo.hashtags,
            date: videoInfo.date,
            private: videoInfo.private,
            ratio: ratio,
        },
        thumbnailUrl: videoInfo.thumbnailUrl,
        pos: pos,
        datetime: (new Date()).getTime(),
    };

    return new Promise((resolve, reject) => {
        sender.sendMessage(captureParam, async (message) => {
            if (message.status === 'error') {
                reject(message.error);
            }
            else {
                resolve();
            }
        });
    });
}
