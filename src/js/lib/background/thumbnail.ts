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

import * as pica from 'pica';

const resizer = pica({
    features: ['js', 'wasm'],
});

export function createThumbnail(image: ImageDataUrl, width, height: number): Promise<ImageDataUrl> {
    return new Promise<string>((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
            resizeThumbnail(img, width, height)
                .then(thumb => resolve(thumb));
        };
        img.src = image;
    });
}

export function resizeThumbnail(image: HTMLCanvasElement | HTMLImageElement | ImageBitmap, width, height: number): Promise<ImageDataUrl> {
    return new Promise<ImageDataUrl>(resolve => {
        const canvas = document.createElement('canvas');
        [canvas.width, canvas.height] = calcThumbnailSize(image.width, image.height, width, height);
        resizer.resize(image, canvas, {
            unsharpAmount: 160,
            unsharpRadius: 0.6,
            unsharpThreshold: 1,
        }).then(result => {
            resolve(result.toDataURL('image/jpeg', 0.96));
        });
    });
}

function calcThumbnailSize(imgWidth, imgHeight, thumbWidth, thumbHeight: number): [number, number] {
    const imgRatio = imgWidth / imgHeight;
    const thumbRatio = thumbWidth / thumbHeight;
    if (thumbRatio >= imgRatio) {
        return [Math.floor(thumbHeight * imgWidth / imgHeight), thumbHeight];
    }
    return [thumbWidth, Math.floor(thumbWidth * imgHeight / imgWidth)];
}
