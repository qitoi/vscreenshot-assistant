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

import PopupWindow from './lib/background/popup-window';
import { ImageDataUrl, VideoInfo } from './lib/types';
import {
    AnimeEndResponse,
    AnimeFrameResponse,
    CaptureRequestBase,
    CaptureResponse,
    MessageRequest,
    RemoveVideoResponse,
} from './lib/messages';

import * as storage from './lib/storage';
import * as prefs from './lib/prefs';
import { createThumbnail } from './lib/background/thumbnail';
import { makeAnimation } from './lib/background/animation';
import { loadPreferences } from './lib/prefs';


const albumWindow = PopupWindow.create('album', 'album.html');

chrome.browserAction.onClicked.addListener(() => {
    albumWindow.show();
});


prefs.watch();

// screenshot

type AnimeFrame = {
    no: number,
    image: ImageDataUrl,
}

type AnimeCapture = {
    [id: string]: {
        timeout: number,
        thumbnail: Promise<ImageDataUrl> | null,
        frames: Promise<AnimeFrame>[],
        width: number,
        height: number,
    },
};

const animeCapture: AnimeCapture = {};

const ANIME_CAPTURE_TIMEOUT = 60 * 1000;

chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
    const message = param as MessageRequest;
    switch (message.type) {
        case 'capture': {
            // スクリーンショットのサムネイル作成
            const thumbnail = prefs.loadPreferences().then(prefs => {
                return createThumbnail(message.image, prefs.thumbnail.width, prefs.thumbnail.height);
            });
            const image = Promise.resolve(message.image);

            capture(message, false, image, thumbnail)
                .then(({ existsVideoThumbnail, videoInfo }) => {
                    const response: (message: CaptureResponse) => void = sendResponse;
                    if (existsVideoThumbnail) {
                        response({
                            type: 'capture-response',
                            status: 'complete',
                        });
                    }
                    else {
                        response({
                            type: 'capture-response',
                            status: 'video-thumbnail',
                            videoInfo,
                        });
                    }
                });

            break;
        }
        case 'video-thumbnail': {
            storage.saveVideoThumbnail(message.videoInfo.platform, message.videoInfo.videoId, message.thumbnail);
            storage.saveVideoInfo({ ...message.videoInfo, lastUpdated: Date.now() });
            break;
        }
        case 'anime-start': {
            prefs.loadPreferences().then(prefs => {
                animeCapture[message.id] = {
                    timeout: window.setTimeout(() => delete animeCapture[message.id], ANIME_CAPTURE_TIMEOUT),
                    thumbnail: null,
                    frames: [],
                    width: prefs.animation.width,
                    height: prefs.animation.height,
                };
            });
            break;
        }
        case 'anime-frame': {
            const response: (message: AnimeFrameResponse) => void = sendResponse;
            if (!(message.id in animeCapture)) {
                response({ type: 'anime-frame-response', status: 'error', error: 'timeout' });
                break;
            }
            addAnimeFrame(message.id, message.no, message.image);
            break;
        }
        case 'anime-end': {
            const response: (message: AnimeEndResponse) => void = sendResponse;
            if (!(message.id in animeCapture)) {
                response({ type: 'anime-end-response', status: 'error', error: 'timeout' });
                break;
            }
            clearTimeout(animeCapture[message.id].timeout);

            const thumbnail = animeCapture[message.id].thumbnail;
            if (thumbnail === null) {
                response({ type: 'anime-end-response', status: 'error', error: 'invalid' });
                break;
            }

            const image = Promise.all(animeCapture[message.id].frames).then(frames =>
                makeAnimation(frames.sort((a, b) => a.no - b.no).map(f => f.image), message.interval)
            );

            capture(message, true, image, thumbnail)
                .then(({ existsVideoThumbnail, videoInfo }) => {
                    if (existsVideoThumbnail) {
                        response({
                            type: 'anime-end-response',
                            status: 'complete',
                        });
                    }
                    else {
                        response({
                            type: 'anime-end-response',
                            status: 'video-thumbnail',
                            videoInfo,
                        });
                    }
                });

            break;
        }
        case 'remove-video': {
            const response: (message: RemoveVideoResponse) => void = sendResponse;
            storage.removeVideoInfo(message.platform, message.videoId)
                .then(() => {
                    response({ type: 'remove-video-response', status: 'complete' });
                });
            break;
        }
    }
    return true;
});

function capture(param: CaptureRequestBase, isAnime: boolean, image: Promise<ImageDataUrl>, thumbnail: Promise<ImageDataUrl>): Promise<{ existsVideoThumbnail: boolean, videoInfo: VideoInfo }> {
    const videoInfo: VideoInfo = {
        ...param.videoInfo,
        platform: param.platform,
        videoId: param.videoId,
        lastUpdated: param.datetime,
    };

    return Promise.all([
        image,
        thumbnail,
    ])
        .then(([image, thumbnail]) => Promise.all([
            image,
            thumbnail,
            storage.existsVideoThumbnail(param.platform, param.videoId)
        ]))
        .then(([image, thumbnail, existsVideoThumbnail]) => {
            storage.saveScreenshot(param.platform, param.videoId, isAnime, param.pos, param.datetime, image, thumbnail);
            if (existsVideoThumbnail) {
                storage.saveVideoInfo({ ...videoInfo, lastUpdated: Date.now() });
            }
            return { existsVideoThumbnail, videoInfo };
        });
}

function addAnimeFrame(id: string, no: number, image: ImageDataUrl) {
    if (animeCapture[id].thumbnail === null) {
        animeCapture[id].thumbnail = loadPreferences().then(prefs => createThumbnail(image, prefs.thumbnail.width, prefs.thumbnail.height));
    }
    animeCapture[id].frames.push(
        createThumbnail(image, animeCapture[id].width, animeCapture[id].height)
            .then((resize): AnimeFrame => ({
                no,
                image: resize,
            }))
    );
}
