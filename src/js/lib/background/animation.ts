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

import * as gif from 'gif.js';
import worker from '!raw-loader!gif.js/dist/gif.worker.js';

import { ImageDataUrl } from '../types';
import { createThumbnail } from './thumbnail';

export async function makeAnimation(images: ImageDataUrl[], width: number, height: number, interval: number, onProgress?: (progress: number) => void): Promise<ImageDataUrl> {
    const encoder = new gif({
        repeat: 0,
        quality: 1,
        workerScript: URL.createObjectURL(new Blob([worker], { type: 'text/javascript' })),
    });

    const elems = await Promise.all(images.map(image =>
        createThumbnail(image, width, height)
            .then(resized => new Promise<HTMLImageElement>(resolve => {
                const img = document.createElement('img') as HTMLImageElement;
                img.src = resized;
                img.onload = () => resolve(img);
            }))
    ));

    for (const img of elems) {
        encoder.addFrame(img, { delay: interval });
    }

    return new Promise(resolve => {
        encoder.on('progress', percent => {
            onProgress && onProgress(percent);
        });
        encoder.on('finished', (blob: Blob) => {
            const reader = new FileReader();
            reader.onload = e => {
                resolve(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
        });
        encoder.render();
    });
}
