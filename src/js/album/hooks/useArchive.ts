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

import * as React from 'react';
import PCancelable from 'p-cancelable';

import { ScreenshotInfo, VideoInfo } from '../../libs/types';
import * as storage from '../../libs/storage';
import * as archive from '../../background/archive';

export type ArchiveFunc = (video: VideoInfo) => Promise<Blob>;
export type CancelFunc = () => void;
export type ProgressFunc = (progress: number) => void;
export type SetProgressHandler = (progressFunc: ProgressFunc) => void;

export default function useArchive(): [ArchiveFunc, CancelFunc, SetProgressHandler] {
    const [cancelable, setCancelable] = React.useState<PCancelable<unknown> | null>(null);
    const onProgressRef = React.useRef<ProgressFunc | null>(null);

    const setProgressHandler = React.useCallback((p: ProgressFunc) => {
        onProgressRef.current = p;
    }, []);

    const cancelFunc = React.useCallback(() => {
        setProgressHandler(() => undefined);
        if (cancelable !== null) {
            cancelable.cancel();
        }
    }, [cancelable, setProgressHandler]);

    const archiveFunc = React.useCallback(async (video: VideoInfo): Promise<Blob> => {
        // reset progress
        onProgressRef.current && onProgressRef.current(0);

        // screenshot info list
        const listCancelable = new PCancelable<ScreenshotInfo[]>(async resolve => {
            resolve(await storage.getScreenshotInfoList(video.platform, video.videoId));
        });
        setCancelable(listCancelable);
        const screenshots = await listCancelable;

        // collect screenshot images
        const collectCancelable = archive.collectFiles(video, screenshots, (current, max) => {
            onProgressRef.current && onProgressRef.current(100 * current / (max + 1));
        });
        setCancelable(collectCancelable);
        const files = await collectCancelable;

        // complete progress
        onProgressRef.current && onProgressRef.current(100);

        // archive images
        const archiveCancelable = archive.zip(files);
        setCancelable(archiveCancelable);
        const zipBlob = await archiveCancelable;

        setCancelable(null);
        setProgressHandler(() => undefined);

        return zipBlob;
    }, [setProgressHandler]);

    return [archiveFunc, cancelFunc, setProgressHandler];
}
