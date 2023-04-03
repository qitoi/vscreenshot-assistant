/*
 *  Copyright 2023 qitoi
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


import * as storage from '../../libs/storage';
import * as prefs from '../../libs/prefs';
import { ImageDataUrl, VideoInfo } from '../../libs/types';
import { downloadImage } from '../../libs/download';
import { resizeImage } from '../../background/resize';
import { makeAnimation } from '../../background/animation';
import { CaptureRequestBase } from './index';
import { MessageServerBuilder } from '../server';
import { PortHandler, PortServerBuilder } from '../server';


export function CaptureServer(server: MessageServerBuilder): void {
    server.handle('capture', async message => {
        // スクリーンショットのサムネイル作成
        const image = Promise.resolve(message.image);
        await saveScreenshot(message, false, image, image)

        const p = await prefs.loadPreferences();
        if (process.env.BROWSER === 'firefox') {
            if (p.screenshot.enabledSaveToClipboard && p.screenshot.fileType == "image/png") {
                saveToClipboardFirefox(message.image);
            }
        }
    });
}


export function AnimeCaptureServer(server: PortServerBuilder): void {
    const handler = new PortHandler<'anime', AnimeCaptureContext>(
        'anime',
        () => ({
            thumbnail: null,
            frames: [],
            width: 0,
            height: 0,
        })
    );

    handler.addMessageHandler('anime-frame', async (request, context) => {
        // サムネイルが未設定であれば最初に到達したフレームをサムネイルに採用
        if (context.thumbnail === null) {
            context.thumbnail = Promise.resolve(request.image);
        }
        // アニメーションの変換サイズが未取得であれば、設定から取得してコンテキストに保存することで固定
        if (context.width === 0 || context.height === 0) {
            const p = await prefs.loadPreferences();
            context.width = p.animation.width;
            context.height = p.animation.height;
        }
        // リサイズ中にキャプチャ終了のメッセージが来てしまいフレームが欠落するというようなことが起きないように、先にフレームのPromiseを登録してからリサイズを待つ
        const resize = resizeImage(request.image, context.width, context.height, 'image/png')
            .then((resize): AnimeFrame => ({
                no: request.no,
                image: resize,
            }));
        context.frames.push(resize);
        await resize;
    });

    handler.addMessageHandler('anime-end', async (request, context, port) => {
        const thumbnail = context.thumbnail;
        if (thumbnail === null) {
            throw new Error('unexpected error');
        }

        // ここではアニメーションGIFの変換完了を待たずに先の処理に進めることで、動画のサムネイル保存などを優先する
        const image = Promise.all(context.frames).then(frames =>
            makeAnimation(
                frames.sort((a, b) => a.no - b.no).map(f => f.image),
                request.interval,
                progress => {
                    if (!port.disconnected) {
                        port.sendMessage('anime-encode-progress', { progress });
                    }
                })
        );

        await saveScreenshot(request, true, image, thumbnail);
    });

    handler.addDisconnectHandler(context => {
        context.frames = [];
        context.thumbnail = null;
    });

    server.handle(handler);
}


// アニメーションキャプチャのメッセージ対応

type AnimeFrame = {
    no: number,
    image: ImageDataUrl,
}

type AnimeCaptureContext = {
    thumbnail: Promise<ImageDataUrl> | null,
    frames: Promise<AnimeFrame>[],
    width: number,
    height: number,
};


async function saveScreenshot(param: CaptureRequestBase, isAnime: boolean, image: Promise<ImageDataUrl>, imageForThumbnail: Promise<ImageDataUrl>): Promise<void> {
    const thumbnailQuality = 94;
    const p = await prefs.loadPreferences();
    const videoInfo: VideoInfo = {
        ...param.videoInfo,
        platform: param.platform,
        videoId: param.videoId,
        lastUpdated: param.datetime,
    };

    // スクリーンショットのサムネイル作成
    const thumbnail: Promise<ImageDataUrl> = imageForThumbnail.then(image => resizeImage(image, p.thumbnail.width, p.thumbnail.height, 'image/jpeg', thumbnailQuality));

    // 動画サムネイルが保存されていない場合はダウンロードする
    type VideoThumbnail = { image: ImageDataUrl, resized: ImageDataUrl };
    let videoThumbnail: Promise<VideoThumbnail | null> = Promise.resolve(null);
    const videoThumbnailExists = await storage.existsVideoThumbnail(param.platform, param.videoId);
    if (!videoThumbnailExists) {
        const download = (param.thumbnailUrl !== null) ? downloadImage(param.thumbnailUrl, true) : Promise.reject();
        videoThumbnail =
            download
                .then(async image => ({
                    image,
                    resized: await resizeImage(image, p.thumbnail.width, p.thumbnail.height, 'image/jpeg', thumbnailQuality),
                }))
                // サムネイルのURLが取得できない場合やサムネイルのダウンロードに失敗した場合、キャプチャ画像用のサムネイル画像で代用
                .catch(async () => ({
                    image: await imageForThumbnail,
                    resized: await thumbnail,
                }));
    }

    return Promise.all([image, thumbnail, videoThumbnail])
        .then(([image, thumbnail, videoThumbnail]) => {
            storage.saveScreenshot(param.platform, param.videoId, isAnime, param.pos, param.datetime, image, thumbnail);
            // 新規保存する動画サムネイルがある場合は保存
            if (videoThumbnail !== null) {
                storage.saveVideoThumbnail(param.platform, param.videoId, videoThumbnail.image, videoThumbnail.resized);
            }
            storage.saveVideoInfo({ ...videoInfo, lastUpdated: Date.now() });
        });
}

async function saveToClipboardFirefox(image:ImageDataUrl)
{
    fetch(image)
        .then(res => res.blob())
        .then(blob => blob.arrayBuffer())
        .then(arrayBuffer =>{
            browser.clipboard.setImageData(arrayBuffer,"png");
        })
        .catch(console.error);
}