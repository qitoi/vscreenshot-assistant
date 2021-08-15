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

import { ImageDataUrl } from '../types';
import * as messages from '../messages';
import * as prefs from '../prefs';
import Platform from '../platforms/platform';


let currentPlatform: Platform | null = null;
let currentVideoId: string | null = null;
let currentVideoInfo: any = null;

export async function getVideoInfo(platform: Platform): Promise<{ videoId: string, videoInfo: any }> {
    const videoId = platform.getVideoId();
    let videoInfo = currentVideoInfo;

    if (videoId === null) {
        return Promise.reject();
    }

    if (currentPlatform !== platform || currentVideoId !== videoId) {
        videoInfo = await platform.initVideoInfo(videoId);
        currentPlatform = platform;
        currentVideoInfo = videoInfo;
        currentVideoId = videoId;
    }

    return { videoId, videoInfo };
}


export function downloadImage(url: string): Promise<ImageDataUrl> {
    return new Promise<ImageDataUrl>(resolve => {
        fetch(url)
            .then(res => res.blob())
            .then(body => {
                const reader = new FileReader();
                reader.readAsDataURL(body);
                reader.onload = () => {
                    resolve(reader.result as ImageDataUrl);
                };
            });
    });
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


export function saveScreenshot(platform: Platform, videoId: string, videoInfo: any, pos: number, ratio: number, param: messages.CaptureRequestAdditionalType): Promise<void> {
    const captureParam: messages.CaptureMessageRequest = {
        ...param,
        platform: platform.PLATFORM_ID,
        videoId: videoId,
        videoInfo: {
            title: platform.getVideoTitle(videoId, videoInfo),
            author: platform.getAuthor(videoId, videoInfo),
            date: platform.getVideoDate(videoId, videoInfo),
            private: platform.isPrivate(videoId, videoInfo),
            ratio: ratio,
        },
        pos: pos,
        datetime: (new Date()).getTime(),
    };

    return new Promise((resolve, reject) => {
        messages.sendMessage(captureParam, async (message) => {
            if (message.status === 'error') {
                reject(message.error);
                return;
            }

            if (message.status === 'video-thumbnail') {
                const thumbnail = await downloadImage(platform.getVideoThumbnailUrl(videoId, videoInfo));
                const thumbnailParam: messages.VideoThumbnailRequest = {
                    type: 'video-thumbnail',
                    videoInfo: message.videoInfo,
                    thumbnail: thumbnail,
                };
                messages.sendMessage(thumbnailParam);
            }
            resolve();
        });
    });
}
