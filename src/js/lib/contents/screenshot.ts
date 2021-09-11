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

import { ImageDataUrl } from '../types';
import * as messages from '../messages';
import * as prefs from '../prefs';
import { Platform } from '../platforms/platform';
import { captureVideo, convertToDataURL, getVideoInfo, saveScreenshot } from './util';


export async function capture(platform: Platform, prefs: prefs.Preferences): Promise<ImageDataUrl> {
    const video = platform.getVideoElement();
    const pos = platform.getVideoPos(video);
    const ratio = video.videoWidth / video.videoHeight;
    const canvas = captureVideo(video);

    const { videoId, videoInfo } = await getVideoInfo(platform);

    const image = convertToDataURL(canvas, prefs);

    const param: Omit<messages.CaptureRequest, keyof messages.CaptureRequestBase> = {
        type: 'capture',
        image,
    };

    return saveScreenshot(platform, videoId, videoInfo, pos, ratio, param, messages)
        .then(() => image);
}
