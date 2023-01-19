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

import { ScreenshotInfo, VideoInfo } from '../libs/types';
import * as storage from '../libs/storage';
import { decodeBase64, getFileExt, parseDataURL } from '../libs/data-url';

export type ArchiveCallback = (zip: Blob, index: number, max: number) => void;
export type ProgressCallback = (current: number, max: number) => void;

function createZip(callback: (err: fflate.FlateError | null, zip: Blob | null) => void): fflate.Zip {
    const chunks: Uint8Array[] = [];
    return new fflate.Zip((err: fflate.FlateError | null, data: Uint8Array, final: boolean) => {
        if (err) {
            callback(err, null);
            return;
        }
        chunks.push(data);
        if (final) {
            callback(null, new Blob(chunks, { type: 'application/zip' }));
        }
    });
}

function appendZipFile(zip: fflate.Zip, image: string, basename: string, mtime: number) {
    const [mime, encoded] = parseDataURL(image);
    const buf = decodeBase64(encoded);
    const ext = getFileExt(mime);
    const file = new fflate.AsyncZipDeflate(`${basename}${ext}`, { level: 0 });
    file.mtime = mtime;
    zip.add(file);
    file.push(buf, true);
}

export function archive(video: VideoInfo, screenshots: ScreenshotInfo[], filesPerArchive: number, callback: ArchiveCallback, progress?: ProgressCallback): PCancelable<void> {
    const screenshotChunks = screenshots.reduce<ScreenshotInfo[][]>(
        (acc, _, index) => (index % filesPerArchive === 0) ? [...acc, screenshots.slice(index, index + filesPerArchive)] : acc,
        []
    );
    return new PCancelable<void>(async (resolve, reject, onCancel) => {
        let canceled = false;
        onCancel(() => canceled = true);

        const max = screenshots.length + 1;
        let archivedImages = 0;

        for (let i = 0; i < screenshotChunks.length; i++) {
            const zip: fflate.Zip | null = createZip((err, zip) => {
                if (err) {
                    reject(err);
                }
                else if (zip) {
                    callback(zip, i, screenshotChunks.length);
                }
            });

            // 最初のzipファイルのみサムネイルを含める
            if (i === 0) {
                const img = await storage.getVideoThumbnail(video.platform, video.videoId);
                if (img !== null) {
                    appendZipFile(zip, img, 'thumbnail', video.lastUpdated);
                }
                archivedImages += 1;
                progress?.(archivedImages, max);
            }

            for (const s of screenshotChunks[i]) {
                if (canceled) {
                    zip.terminate();
                    return;
                }
                const img = await storage.getScreenshot(s.platform, s.videoId, s.no);
                if (canceled) {
                    zip.terminate();
                    return;
                }
                if (img !== null) {
                    const no = ('' + s.no).padStart(4, '0');
                    appendZipFile(zip, img, `screenshot_${no}`, s.datetime);
                }
                archivedImages += 1;
                progress?.(archivedImages, max);
            }

            zip.end();
        }

        resolve();
    });
}
