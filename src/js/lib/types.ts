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

export type ImageDataUrl = string;

export type VideoInfo = {
    platform: string,
    videoId: string,
    title: string,
    author: string,
    private: boolean,
    ratio: number,
    date: number,
    lastUpdated: number,
};

export function getVideoKey(v: VideoInfo): string {
    return `v:${v.platform}:${v.videoId}`;
}

export type ScreenshotInfo = {
    platform: string,
    videoId: string,
    no: number,
    pos: number, // time position
    datetime: number, // capture time
};

export type ScreenshotSummary = {
    info: ScreenshotInfo,
    thumbnail: ImageDataUrl,
};

export function getScreenshotKey(s: ScreenshotInfo): string {
    return `s:${s.platform}:${s.videoId}:${s.no}`;
}


// messaging parameter

export type EventParam = {
    event: string,
};

export type CaptureParam = EventParam & {
    event: 'capture',
    platform: string,
    videoId: string,
    // video info
    title: string,
    author: string,
    private: boolean,
    ratio: number,
    thumbnail: string,
    videoDate: number,
    // screenshot
    image: ImageDataUrl,
    pos: number,
    datetime: number,
};
