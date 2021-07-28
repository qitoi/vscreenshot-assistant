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

import * as fflate from 'fflate';
import PCancelable from 'p-cancelable';

import { ScreenshotInfo } from '../types';
import * as storage from '../storage';
import { decodeBase64, getFileExt, parseDataURL } from '../data-url';

type ProgressCallback = (current: number, max: number) => void;

export function collectFiles(screenshots: ScreenshotInfo[], progress?: ProgressCallback): PCancelable<fflate.AsyncZippable> {
    return new PCancelable<fflate.AsyncZippable>(async (resolve, reject, onCancel) => {
        let cancel = false;
        onCancel(() => cancel = true);

        const files: fflate.AsyncZippable = {};
        const max = screenshots.length;
        let current = 0;

        for (const s of screenshots) {
            if (cancel) {
                return;
            }

            if (progress !== undefined) {
                progress(current, max);
            }

            const img = await storage.getScreenshot(s.platform, s.videoId, s.no);
            const [mime, data] = parseDataURL(img);
            const ext = getFileExt(mime);
            const filename = `image_${s.no}${ext}`;
            files[filename] = [decodeBase64(data), { mtime: s.datetime }];
            current += 1;
        }

        if (progress !== undefined) {
            progress(current, max);
        }

        resolve(files);
    });
}

export function zip(files: fflate.AsyncZippable): PCancelable<Blob> {
    return new PCancelable<Blob>((resolve, reject, onCancel) => {
        let cancel: fflate.AsyncTerminable | null = null;
        onCancel(() => {
            if (cancel !== null) {
                cancel();
            }
        });
        cancel = fflate.zip(files, { level: 0, mem: 12, consume: true }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(new Blob([data], { type: 'application/zip' }));
            }
        });
    });
}
