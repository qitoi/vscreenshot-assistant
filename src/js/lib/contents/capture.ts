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
import * as Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

import { AnimationMessage, CaptureMessage, CaptureMessageBase, ImageDataUrl, VideoThumbnailMessage } from '../types';
import Platform from '../platforms/platform';
import * as prefs from '../prefs';
import { downloadImage } from './download';


export function Setup(platform: Platform): void {
    prefs.watch().addEventListener(p => {
        bindHotkey(platform, p);
    });
    prefs.loadPreferences().then(p => {
        bindHotkey(platform, p);
    });
}

function bindHotkey(platform: Platform, p: prefs.Preferences) {
    hotkeys.unbind();

    let pressed = false;
    hotkeys(p.general.captureHotkey, { keyup: true }, event => {
        if (!pressed && event.type === 'keydown') {
            pressed = true;
            if (platform.checkVideoPage()) {
                capture(platform);
            }
        }
        if (event.type === 'keyup') {
            pressed = false;
        }
    });

    let animationPressed = false;
    hotkeys(p.animation.captureHotkey, { keyup: true }, event => {
        if (!animationPressed && event.type === 'keydown') {
            animationPressed = true;
            if (platform.checkVideoPage()) {
                captureAnimation(platform);
            }
        }
        if (event.type === 'keyup') {
            animationPressed = false;
        }
    });
}


async function capture(platform: Platform) {
    const video = platform.getVideoElement();
    const pos = video.currentTime;
    const ratio = video.videoWidth / video.videoHeight;
    const canvas = captureVideo(video);

    const { videoId, videoInfo } = await getVideoInfo(platform);
    const p = await prefs.loadPreferences();

    const image = convertToDataURL(canvas, p);

    const param: Omit<CaptureMessage, keyof CaptureMessageBase> = {
        type: 'capture',
        image,
    };

    const screenshot = saveScreenshot(platform, videoId, videoInfo, pos, ratio, param);

    if (p.general.copyClipboard) {
        copyToClipboard(canvas);
    }

    if (p.general.notifyToast) {
        screenshot.then(() => {
            showToast(image, p);
        });
    }
}

async function captureAnimation(platform: Platform) {
    const p = await prefs.loadPreferences();
    const video = platform.getVideoElement();
    const pos = video.currentTime;
    const ratio = video.videoWidth / video.videoHeight;
    const interval = p.animation.interval;
    const canvases = startCaptureAnimation(video, interval);

    const { videoId, videoInfo } = await getVideoInfo(platform);

    const images = (await canvases).map(c => convertToDataURL(c, p));

    const param: Omit<AnimationMessage, keyof CaptureMessageBase> = {
        type: 'animation',
        images,
        interval,
    };

    const screenshot = saveScreenshot(platform, videoId, videoInfo, pos, ratio, param);

    if (p.general.notifyToast) {
        screenshot.then(() => {
            showToast(images[0], p);
        });
    }
}

async function startCaptureAnimation(video: HTMLVideoElement, interval: number): Promise<HTMLCanvasElement[]> {
    return new Promise(resolve => {
        const canvased: HTMLCanvasElement[] = [];
        const id = setInterval(() => {
            canvased.push(captureVideo(video));
            if (canvased.length >= 100) {
                clearInterval(id);
                resolve(canvased);
            }
        }, interval);
    });
}


let currentPlatform: Platform | null = null;
let currentVideoId: string | null = null;
let currentVideoInfo: any = null;

async function getVideoInfo(platform: Platform): Promise<{ videoId: string, videoInfo: any }> {
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

function captureVideo(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    return canvas;
}

function convertToDataURL(canvas: HTMLCanvasElement, p: prefs.Preferences): ImageDataUrl {
    return canvas.toDataURL(p.screenshot.fileType, (+p.screenshot.quality / 100));
}

type AdditionalParam = Omit<CaptureMessage, keyof CaptureMessageBase> | Omit<AnimationMessage, keyof CaptureMessageBase>;

function saveScreenshot(platform: Platform, videoId: string, videoInfo: any, pos: number, ratio: number, param: AdditionalParam): Promise<void> {
    const captureParam: CaptureMessageBase = {
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

    return new Promise(resolve => {
        chrome.runtime.sendMessage(captureParam, async ({ existsVideoThumbnail, videoInfoParam }) => {
            if (!existsVideoThumbnail) {
                const thumbnail = await downloadImage(platform.getVideoThumbnailUrl(videoId, videoInfo));
                const thumbnailParam: VideoThumbnailMessage = {
                    type: 'video-thumbnail',
                    videoInfo: videoInfoParam,
                    thumbnail: thumbnail,
                };
                chrome.runtime.sendMessage(thumbnailParam);
            }
            resolve();
        });
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


let toasts: ReturnType<typeof Toastify>[] = [];

function showToast(image: string, p: prefs.Preferences) {
    for (const t of toasts) {
        // @ts-ignore
        t.hideToast();
    }
    toasts = [];

    const img = document.createElement('img') as HTMLImageElement;
    img.src = image;
    img.style['width'] = '100%';
    img.style['height'] = '100%';
    img.style['objectFit'] = 'contain';
    img.onload = () => {
        const div = document.createElement('div') as HTMLDivElement;
        div.style['width'] = '100%';
        div.style['height'] = '100%';
        div.appendChild(img);
        const toast = Toastify({
            node: div,
            duration: p.general.notifyDuration,
            gravity: (p.general.notifyPosition === prefs.ToastPositions.LeftTop || p.general.notifyPosition === prefs.ToastPositions.RightTop) ? 'top' : 'bottom',
            position: (p.general.notifyPosition === prefs.ToastPositions.LeftTop || p.general.notifyPosition === prefs.ToastPositions.LeftBottom) ? 'left' : 'right',
            stopOnFocus: false,
            callback: () => {
                const idx = toasts.indexOf(toast);
                if (idx !== -1) {
                    // @ts-ignore
                    toasts[idx].hideToast();
                    toasts.splice(idx, 1);
                }
            },
            // @ts-ignore
            style: {
                width: `${p.thumbnail.width}px`,
                aspectRatio: `${p.thumbnail.width} / ${p.thumbnail.height}`,
                padding: '8px',
                background: 'rgba(33, 33, 33, 0.94)',
            },
        });
        toast.showToast();
        toasts.push(toast);
    };
}
