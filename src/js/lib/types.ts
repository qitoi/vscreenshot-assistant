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
    type: string,
};

export type CaptureVideoInfo = Omit<VideoInfo, 'platform' | 'videoId' | 'lastUpdated'>;

export type CaptureParam = EventParam & {
    type: 'capture',
    platform: string,
    videoId: string,
    // video
    videoInfo: CaptureVideoInfo,
    // screenshot
    pos: number,
    datetime: number,
    image: ImageDataUrl,
};

export type VideoThumbnailParam = EventParam & {
    type: 'video-thumbnail',
    platform: string,
    videoId: string,
    thumbnail: ImageDataUrl,
};
