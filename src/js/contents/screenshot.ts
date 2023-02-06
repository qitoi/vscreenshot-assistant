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

import { ImageDataUrl } from '../libs/types';
import * as prefs from '../libs/prefs';
import { Platform } from '../platforms/platform';
import * as client from '../messages/client';
import { captureVideo, convertToDataURL, getVideoInfo } from './util';


export async function capture(platform: Platform, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();

    if (video === null || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('invalid video element');
    }

    const pos = platform.getVideoPos(video);
    const ratio = video.videoWidth / video.videoHeight;
    const canvas = captureVideo(video);

    const { videoId, videoInfo } = await getVideoInfo(platform);

    const image = convertToDataURL(canvas, prefs);

    await client.sendMessage('capture', {
        platform: platform.PLATFORM_ID,
        videoId: videoId,
        videoInfo: {
            ...videoInfo,
            ratio: ratio,
        },
        thumbnailUrl: videoInfo.thumbnailUrl,
        pos: pos,
        datetime: (new Date()).getTime(),
        image: image,
    });

    return image;
}
