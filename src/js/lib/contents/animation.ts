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

import { AnimeEndMessage, AnimeFrameMessage, AnimeStartMessage, CaptureMessageBase, ImageDataUrl } from '../types';
import * as prefs from '../prefs';
import Platform from '../platforms/platform';
import { captureVideo, convertToDataURL, getVideoInfo, saveScreenshot } from './util';


export async function capture(platform: Platform, stop: Promise<void>, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();
    const pos = video.currentTime;
    const ratio = video.videoWidth / video.videoHeight;
    const interval = prefs.animation.interval;
    const capture = startCaptureAnimation(video, interval, stop);
    const { videoId, videoInfo } = await getVideoInfo(platform);

    const time = Date.now();
    const id = `${time}-${pos}`;

    const start: AnimeStartMessage = {
        type: 'anime-start',
        id,
    };
    chrome.runtime.sendMessage(start);

    const canvases = await capture;
    const firstFrame = await sendFrame(id, canvases, prefs);

    const end: Omit<AnimeEndMessage, keyof CaptureMessageBase> = {
        type: 'anime-end',
        id,
        interval,
    };

    return saveScreenshot(platform, videoId, videoInfo, pos, ratio, end)
        .then(() => firstFrame);
}


async function startCaptureAnimation(video: HTMLVideoElement, interval: number, stop: Promise<void>): Promise<HTMLCanvasElement[]> {
    const canvased: HTMLCanvasElement[] = [];
    const id = setInterval(() => {
        canvased.push(captureVideo(video));
    }, interval);
    await stop;
    clearInterval(id);
    return canvased;
}


async function sendFrame(id: string, canvases: HTMLCanvasElement[], prefs: prefs.Preferences): Promise<ImageDataUrl> {
    let firstFrame: ImageDataUrl = '';
    let no = 0;
    for (const canvas of canvases) {
        no += 1;
        const image = convertToDataURL(canvas, prefs);

        if (no === 1) {
            firstFrame = image;
        }

        const frame: AnimeFrameMessage = {
            type: 'anime-frame',
            id,
            no,
            image,
        };
        chrome.runtime.sendMessage(frame);
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return firstFrame;
}
