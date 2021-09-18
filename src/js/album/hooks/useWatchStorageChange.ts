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

import { VideoInfo } from '../../lib/types';
import { listenAuto } from '../../lib/event-listen';
import { useDispatch } from '../store';
import { appendVideo, removeVideo } from '../features/video/videoSlice';
import { appendScreenshot } from '../features/screenshot/screenshotSlice';

export function useWatchStorageChange(): void {
    const dispatch = useDispatch();

    React.useEffect(() => {
        const callback = (changes: { [key: string]: chrome.storage.StorageChange }, area: chrome.storage.AreaName) => {
            if (area !== 'local') {
                return;
            }

            for (const [key, change] of Object.entries(changes)) {
                const type = key.substring(0, 3);
                switch (type) {
                    case 'v:i': {
                        if ('newValue' in change) {
                            dispatch(appendVideo(change.newValue));
                        }
                        else {
                            const video = change.oldValue as VideoInfo;
                            dispatch(removeVideo({ platform: video.platform, videoId: video.videoId, removeFromStorage: false }));
                        }
                        break;
                    }
                    case 's:i': {
                        if ('newValue' in change) {
                            const [, , platform, videoId] = key.split(':');
                            const thumbnail = changes['s:t' + key.substring(3)].newValue;
                            dispatch(appendScreenshot({ platform, videoId, target: change.newValue, thumbnail: thumbnail }));
                        }
                        break;
                    }
                }
            }
        };
        listenAuto(chrome.storage.onChanged, callback);
        return () => chrome.storage.onChanged.removeListener(callback);
    }, [dispatch]);
}
