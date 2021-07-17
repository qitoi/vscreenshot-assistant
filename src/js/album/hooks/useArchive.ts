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

import { ScreenshotInfo } from '../../lib/types';
import * as storage from '../../lib/background/storage';
import * as archive from '../../lib/background/archive';

export type ArchiveFunc = (platform: string, videoId: string) => Promise<Blob>;
export type CancelFunc = () => void;
export type ProgressFunc = (progress: number) => void;
export type SetProgressHandler = (ProgressFunc) => void;

export default function useArchive(): [ArchiveFunc, CancelFunc, SetProgressHandler] {
    const [cancelable, setCancelable] = React.useState<PCancelable<any>>(null);
    const onProgressRef = React.useRef<ProgressFunc>(() => {
    });

    const setProgressHandler = React.useCallback((p: ProgressFunc) => {
        onProgressRef.current = p;
    }, []);

    const cancel = React.useCallback(() => {
        if (cancelable !== null) {
            cancelable.cancel();
        }
    }, [cancelable]);

    const zip = React.useCallback(async (platform: string, videoId: string): Promise<Blob> => {
        // reset progress
        onProgressRef.current(0);

        // screenshot info list
        const listCancelable = new PCancelable<ScreenshotInfo[]>(async resolve => {
            resolve(await storage.getScreenshotInfoList(platform, videoId));
        });
        setCancelable(listCancelable);
        const screenshots = await listCancelable;

        // collect screenshot images
        const collectCancelable = archive.collectFiles(screenshots, (current, max) => {
            onProgressRef.current(100 * current / max);
        });
        setCancelable(collectCancelable);
        const files = await collectCancelable;

        // complete progress
        onProgressRef.current(100);

        // archive images
        const archiveCancelable = archive.zip(files);
        setCancelable(archiveCancelable);
        const zipBlob = await archiveCancelable;

        setCancelable(null);

        return zipBlob;
    }, []);

    return [zip, cancel, setProgressHandler];
}
