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
import { Port } from '../port';
import * as prefs from '../prefs';
import Platform from '../platforms/platform';
import { getLocalizedText } from '../components/LocalizedText';
import { captureVideo, convertToDataURL, getVideoInfo, saveScreenshot } from './util';
import { showToast, Toast } from './toast';


export async function capture(platform: Platform, stop: Promise<void>, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();
    const pos = video.currentTime;
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
    const port = new Port(id);

    // キャプチャ終了待ち
    const canvases = await capture;

    setCaption(getLocalizedText('contents_animation_convert_caption'));
    setContent('0.00 %');

    // キャプチャしたフレームを全てbackgroundに送信
    const firstFrame = await sendFrame(port, id, canvases, prefs);

    // GIF変換の進捗メッセージ受信
    port.onMessage.addListener(message => {
        if (message.type === 'anime-encode-progress') {
            const percent = (message.progress * 100).toFixed(2);
            setContent(`${percent} %`);
        }
    });

    // GIF変換開始・完了待ち
    const endParam: Omit<messages.AnimeEndRequest, keyof messages.CaptureRequestBase> = {
        type: 'anime-end',
        id,
        interval,
    };
    await saveScreenshot(platform, videoId, videoInfo, pos, ratio, endParam, port);

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


async function sendFrame(port: Port, id: string, canvases: HTMLCanvasElement[], prefs: prefs.Preferences): Promise<ImageDataUrl> {
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
        port.sendMessage(frame);
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return firstFrame;
}


function showProgressToast(prefs: prefs.Preferences): { toast: Toast, setCaption: (text: string) => void, setContent: (text: string) => void } {
    const div = document.createElement('div');

    const caption = document.createElement('p');
    caption.style['margin'] = '0';
    caption.style['padding'] = '0';

    const content = document.createElement('p');
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
