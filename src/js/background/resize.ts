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
import { decodeDataURL, encodeDataURL } from '../libs/data-url';

import * as pica from 'pica';

const resizer = pica({
    features: ['js', 'wasm'],
    createCanvas(width: number, height: number): HTMLCanvasElement {
        // @ts-ignore
        return new OffscreenCanvas(width, height);
    }
});

export async function resizeImage(image: ImageDataUrl, width: number, height: number, fileType: string, quality?: number): Promise<ImageDataUrl> {
    const blob = decodeDataURL(image);
    const bitmap = await createImageBitmap(blob);
    return resize(bitmap, width, height, fileType, quality)
}

async function resize(image: ImageBitmap, width: number, height: number, fileType: string, quality?: number): Promise<ImageDataUrl> {
    const [w, h] = calcSize(image.width, image.height, width, height);
    const canvas = new OffscreenCanvas(w, h);
    // @ts-ignore
    const resized: OffscreenCanvas = await resizer.resize(image, canvas, {
        unsharpAmount: 160,
        unsharpRadius: 0.6,
        unsharpThreshold: 1,
    });
    const blob = await resized.convertToBlob({
        type: fileType,
        quality: quality,
    });
    return encodeDataURL(blob);
}

// 元画像のアスペクト比を保ったまま、指定のサイズに内接するようにリサイズするためのサイズを計算する
function calcSize(srcWidth: number, srcHeight: number, resizeWidth: number, resizeHeight: number): [number, number] {
    const srcRatio = srcWidth / srcHeight;
    const resizeRatio = resizeWidth / resizeHeight;
    if (resizeRatio >= srcRatio) {
        return [Math.floor(resizeHeight * srcWidth / srcHeight), resizeHeight];
    }
    return [resizeWidth, Math.floor(resizeWidth * srcHeight / srcWidth)];
}
