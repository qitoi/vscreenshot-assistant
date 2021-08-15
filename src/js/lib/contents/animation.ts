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
import { getLocalizedText } from '../components/LocalizedText';
import { captureVideo, convertToDataURL, getVideoInfo, saveScreenshot } from './util';
import { showToast } from './toast';


export async function capture(platform: Platform, stop: Promise<void>, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();
    const pos = video.currentTime;
    const ratio = video.videoWidth / video.videoHeight;
    const interval = prefs.animation.interval;

    const div = document.createElement('div');
    const cap = document.createElement('p');
    cap.textContent = getLocalizedText('contents_animation_capture_caption');
    cap.style['margin'] = '0';
    cap.style['padding'] = '0';
    const progress = document.createElement('p');
    progress.textContent = '...';
    progress.style['margin'] = '0';
    progress.style['padding'] = '0';
    progress.style['textAlign'] = 'center';

    div.append(cap, progress);

    const handleCaptureProgress = (frame: number, time: number) => {
        progress.textContent = getLocalizedText('contents_animation_capture_progress', ['' + frame, time.toFixed(2)]);
    };

    const toast = showToast({
        node: div,
        duration: -1,
    }, prefs);

    const capture = startCaptureAnimation(video, interval, stop, prefs, handleCaptureProgress);
    const { videoId, videoInfo } = await getVideoInfo(platform);

    const time = Date.now();
    const id = `${time}-${pos}`;

    const start: messages.AnimeStartRequest = {
        type: 'anime-start',
        id,
    };
    messages.sendMessage(start);

    const canvases = await capture;

    toast.hideToast();

    const firstFrame = await sendFrame(id, canvases, prefs);

    const end: Omit<messages.AnimeEndRequest, keyof messages.CaptureRequestBase> = {
        type: 'anime-end',
        id,
        interval,
    };

    return saveScreenshot(platform, videoId, videoInfo, pos, ratio, end)
        .then(() => firstFrame);
}


async function startCaptureAnimation(video: HTMLVideoElement, interval: number, stop: Promise<void>, prefs: prefs.Preferences, onProgress: (frame: number, time: number) => void): Promise<HTMLCanvasElement[]> {
    const canvases: HTMLCanvasElement[] = [];

    const capture = () => {
        canvases.push(captureVideo(video));
        const sec = canvases.length * interval / 1000;
        onProgress(canvases.length, sec);
    };

    const id = setInterval(capture, interval);

    await stop;
    clearInterval(id);
    return canvases;
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

        const frame: messages.AnimeFrameRequest = {
            type: 'anime-frame',
            id,
            no,
            image,
        };
        messages.sendMessage(frame);
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return firstFrame;
}
