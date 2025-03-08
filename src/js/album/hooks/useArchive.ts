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
import { archive, ArchiveCallback } from '../../background/archive';

export type ArchiveFunc = (video: VideoInfo, filesPerArchive: number, callback: ArchiveCallback) => Promise<void>;
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

    const archiveFunc = React.useCallback(async (video: VideoInfo, filesPerArchive: number, callback: ArchiveCallback): Promise<void> => {
        // reset progress
        onProgressRef.current?.(0);

        // screenshot info list
        const listCancelable = new PCancelable<ScreenshotInfo[]>(async resolve => {
            resolve(await storage.getScreenshotInfoList(video.platform, video.videoId));
        });
        setCancelable(listCancelable);
        const screenshots = await listCancelable;
        // スクリーンショット情報を撮影順にソート
        screenshots.sort((a, b) => a.no - b.no);

        const archiveCancelable = archive(video, screenshots, filesPerArchive, callback, (current, max) => {
            onProgressRef.current?.(100 * current / (max + 1));
        });
        setCancelable(archiveCancelable);
        await archiveCancelable;

        // complete progress
        onProgressRef.current?.(100);

        setCancelable(null);
        setProgressHandler(() => undefined);

    }, [setProgressHandler]);

    return [archiveFunc, cancelFunc, setProgressHandler];
}
