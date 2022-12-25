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

import * as pica from 'pica';

const resizer = pica({
    features: ['js', 'wasm', 'ww'],
});

export function resizeImage(image: ImageDataUrl, width: number, height: number, fileType: string, quality?: number): Promise<ImageDataUrl> {
    return new Promise<string>((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
            resize(img, width, height, fileType, quality)
                .then(thumb => resolve(thumb));
        };
        img.src = image;
    });
}

async function resize(image: HTMLCanvasElement | HTMLImageElement, width: number, height: number, fileType: string, quality?: number): Promise<ImageDataUrl> {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = calcSize(image.width, image.height, width, height);
    const resized = await resizer.resize(image, canvas, {
        unsharpAmount: 160,
        unsharpRadius: 0.6,
        unsharpThreshold: 1,
    });
    return resized.toDataURL(fileType, quality);
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
