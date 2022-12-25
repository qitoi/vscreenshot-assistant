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

import { ImageDataUrl } from './types';

const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
};

export function getFileExt(mime: string): string {
    return mimeToExt[mime] ?? '';
}

export function convertScreenshotToFile(screenshot: ImageDataUrl): File {
    const blob = decodeDataURL(screenshot);
    const ext = getFileExt(blob.type);
    return new File([blob], `image${ext}`, {
        type: blob.type,
    });
}

export function decodeDataURL(url: string): Blob {
    const [mime, encoded] = parseDataURL(url);
    const buf = decodeBase64(encoded);
    return new Blob([buf], { type: mime });
}

export function decodeBase64(encoded: string): Uint8Array {
    const data = atob(encoded);
    const buf = new Uint8Array(new ArrayBuffer((data.length)));
    for (let i = 0; i < data.length; i++) {
        buf[i] = data.charCodeAt(i);
    }
    return buf;
}

export function parseDataURL(url: string): [mime: string, body: string] {
    const body = url.substring(url.indexOf(',') + 1);
    const mime = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
    return [mime, body];
}
