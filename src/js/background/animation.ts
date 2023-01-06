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

import * as iq from 'image-q';
import * as omggif from 'omggif';

import { ImageDataUrl } from '../libs/types';
import { decodeDataURL, encodeDataURL } from "../libs/data-url";


type PointContainer = iq.utils.PointContainer;


export async function makeAnimation(images: ImageDataUrl[], interval: number, onProgress?: (progress: number) => void): Promise<ImageDataUrl> {
    if (images.length == 0) {
        return Promise.reject<ImageDataUrl>();
    }

    const frameCount = images.length;
    const paletteAdditionalCount = 2;
    const prevCount = Math.floor(paletteAdditionalCount / 2);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let current: PointContainer | null = await loadImage(images.shift()!);
    let prev: PointContainer[] = [];
    const next: PointContainer[] = [];

    for (let i = 0; i < paletteAdditionalCount - prevCount; i++) {
        const img = images.shift();
        if (img) {
            const loaded = await loadImage(img);
            next.push(loaded);
        }
        else {
            break;
        }
    }

    const width = current.getWidth();
    const height = current.getHeight();

    const buffer = new Uint8Array(width * height * frameCount * 5);
    const writer = new omggif.GifWriter(buffer, width, height, { loop: 0 });

    let processed = 0;
    while (current) {
        // ちらつきを防止するため、前後のフレームも含めてカラーパレットを作成する
        const palette = await iq.buildPalette(
            [...prev, current, ...next],
            {
                paletteQuantization: "rgbquant",
            }
        );
        const reduced = await iq.applyPalette(current, palette);
        const buf = reduced.toUint32Array();

        // Image: 32bit color -> index
        const plt = palette.getPointContainer().toUint32Array();
        const indexed = new Uint8Array(buf.length);
        for (let i = 0; i < buf.length; i++) {
            indexed[i] = plt.indexOf(buf[i]);
        }

        // Color Palette: ABGR -> RGB
        for (let i = 0; i < plt.length; i++) {
            const p = plt[i];
            plt[i] = ((p & 0x0000ff) << 16) | (p & 0x00ff00) | ((p & 0xff0000) >> 16);
        }

        // @ts-ignore
        writer.addFrame(0, 0, width, height, indexed, {
            delay: Math.round(interval / 10),
            palette: plt,
        })

        processed += 1;
        onProgress && onProgress(processed / frameCount);

        prev = [...prev, current].slice(-prevCount);
        current = next.shift() ?? null;
        const nextImage = images.shift();
        if (nextImage) {
            const loaded = await loadImage(nextImage);
            next.push(loaded);
        }
    }

    const gif = buffer.subarray(0, writer.end());
    const blob = new Blob([gif], { type: 'image/gif' });
    return encodeDataURL(blob);
}

async function loadImage(image: ImageDataUrl): Promise<PointContainer> {
    const blob = decodeDataURL(image);
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return Promise.reject<PointContainer>();
    }

    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    return iq.utils.PointContainer.fromImageData(img);
}
