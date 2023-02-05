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
import * as prefs from '../libs/prefs';
import { Platform } from '../platforms/platform';
import { getLocalizedText } from '../libs/localize';
import * as client from "../messages/client";
import { captureVideo, convertToDataURL, getVideoInfo } from './util';
import { showToast, Toast } from './toast';


export async function capture(platform: Platform, stop: Promise<void>, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();

    if (video === null || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('invalid video element');
    }

    const pos = platform.getVideoPos(video);
    const ratio = video.videoWidth / video.videoHeight;
    const interval = prefs.animation.interval;

    const { toast, setCaption, setContent } = showProgressToast(prefs);
    setCaption(getLocalizedText('contents_animation_capture_caption'));

    const handleCaptureProgress = (frame: number, time: number) => {
        setContent(getLocalizedText('contents_animation_capture_progress', ['' + frame, time.toFixed(2)]));
    };

    const capture = startCaptureAnimation(video, interval, stop, prefs, handleCaptureProgress);
    const { videoId, videoInfo } = await getVideoInfo(platform);

    const time = Date.now();
    const id = `anime-capture:${time}-${pos}`;

    // backgroundとのコネクション開始
    const port = client.connectPort('anime');
    port.onDisconnect.addListener(() => {
        setContent('エラーが発生しました');
        setTimeout(() => {
            toast.hideToast();
        }, 3000);
    });

    // キャプチャ終了待ち
    const canvases = await capture;

    setCaption(getLocalizedText('contents_animation_resize_caption'));
    setContent('0.00 %');

    // キャプチャしたフレームを全てbackgroundに送信
    const firstFrame = await sendFrame(port, id, canvases, prefs, progress => {
        const percent = (progress * 100).toFixed(2);
        setContent(`${percent} %`);
    });

    setCaption(getLocalizedText('contents_animation_convert_caption'));
    setContent('0.00 %');

    // GIF変換の進捗メッセージ受信
    port.handle('anime-encode-progress', async request => {
        const percent = (request.progress * 100).toFixed(2);
        setContent(`${percent} %`);
    });

    // GIF変換開始・完了待ち
    await port.sendMessage('anime-end', {
        platform: platform.PLATFORM_ID,
        videoId: videoId,
        videoInfo: {
            ...videoInfo,
            ratio: ratio,
        },
        thumbnailUrl: videoInfo.thumbnailUrl,
        pos: pos,
        datetime: (new Date()).getTime(),
        id: id,
        interval: interval,
    });

    toast.hideToast();
    port.disconnect();

    return firstFrame;
}


async function startCaptureAnimation(video: HTMLVideoElement, interval: number, stop: Promise<void>, prefs: prefs.Preferences, onProgress: (frame: number, time: number) => void): Promise<HTMLCanvasElement[]> {
    const canvases: HTMLCanvasElement[] = [];

    const capture = () => {
        canvases.push(captureVideo(video));
        const sec = canvases.length * interval / 1000;
        onProgress(canvases.length, sec);
    };

    capture();
    const id = setInterval(capture, interval);

    await stop;
    clearInterval(id);
    return canvases;
}


async function sendFrame(port: client.PortClient<'anime'>, id: string, canvases: HTMLCanvasElement[], prefs: prefs.Preferences, onProgress: (progress: number) => void): Promise<ImageDataUrl> {
    let firstFrame: ImageDataUrl = '';
    let no = 0;
    let completed = 0;
    const promises: Promise<void>[] = [];
    const total = canvases.length;

    for (const canvas of canvases) {
        no += 1;
        const image = convertToDataURL(canvas, prefs);

        if (no === 1) {
            firstFrame = image;
        }

        const p = port.sendMessage('anime-frame', { id, no, image }).then(() => {
            completed += 1;
            onProgress(completed / total);
        });
        promises.push(p);

        await new Promise(resolve => setTimeout(resolve, 0));
    }

    await Promise.all(promises);

    return firstFrame;
}


function showProgressToast(prefs: prefs.Preferences): { toast: Toast, setCaption: (text: string) => void, setContent: (text: string) => void } {
    const div = document.createElement('div');

    const caption = document.createElement('p');
    caption.textContent = '　';
    caption.style['margin'] = '0';
    caption.style['padding'] = '0';

    const content = document.createElement('p');
    content.textContent = '　';
    content.style['margin'] = '0';
    content.style['padding'] = '0';
    content.style['textAlign'] = 'center';

    div.append(caption, content);

    const toast = showToast({
        node: div,
        duration: -1,
    }, prefs);

    return {
        toast,
        setCaption: (text: string) => {
            caption.textContent = text;
        },
        setContent: (text: string) => {
            content.textContent = text;
        },
    };
}
