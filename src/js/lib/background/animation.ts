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


export async function makeAnimation(images: ImageDataUrl[], interval: number, onProgress?: (progress: number) => void): Promise<ImageDataUrl> {
    const workerScript = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
    const encoder = new gif({
        repeat: 0,
        quality: 1,
        workerScript,
    });

    const elems = await Promise.all(images.map(image =>
        new Promise<HTMLImageElement>(resolve => {
            const img = document.createElement('img') as HTMLImageElement;
            img.src = image;
            img.onload = () => {
                img.onload = null;
                resolve(img);
            };
        }))
    );

    for (const img of elems) {
        encoder.addFrame(img, { delay: interval });
    }

    return new Promise(resolve => {
        encoder.on('progress', percent => {
            onProgress && onProgress(percent);
        });
        encoder.once('finished', (blob: Blob) => {
            encoder.removeAllListeners();
            URL.revokeObjectURL(workerScript);
            const reader = new FileReader();
            reader.onload = e => {
                reader.onload = null;
                resolve(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
        });
        encoder.render();
    });
}
