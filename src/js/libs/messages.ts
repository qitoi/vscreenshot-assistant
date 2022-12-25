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

import { ImageDataUrl, ScreenshotInfo, VideoInfo } from './types';


export function sendMessage<T extends MessageRequest>(message: T, callback?: (message: ResponseType<T>) => void): void {
    callback ??= () => undefined;
    chrome.runtime.sendMessage(message, callback);
}


export type ResponseType<T extends MessageRequest> = T extends any ? FindMap<T, RequestResponseMap> : never;

export type MessageRequest = MapKeys<RequestResponseMap>;
export type MessageResponse = MapValues<RequestResponseMap>;


type RequestResponseMap = [
    [CaptureRequest, CaptureResponse],
    [AnimeFrameRequest, AnimeFrameResponse],
    [AnimeEndRequest, AnimeEndResponse],
    [AnimeEncodeProgressRequest, never],
    [RemoveVideoRequest, RemoveVideoResponse],
    [ResetStorageRequest, ResetStorageResponse],
    [ShareScreenshotRequest, never],
];


export type CaptureMessageRequest = CaptureRequest | AnimeEndRequest;
export type CaptureRequestAdditionalType = OmitAll<CaptureMessageRequest, keyof CaptureRequestBase>;


export type CaptureRequestBase = {
    platform: string,
    videoId: string,
    // video
    videoInfo: Omit<VideoInfo, 'platform' | 'videoId' | 'lastUpdated'>,
    thumbnailUrl: string | null,
    // screenshot
    pos: number,
    datetime: number,
};

export type CaptureRequest = CaptureRequestBase & {
    type: 'capture',
    image: ImageDataUrl,
};
export type CaptureResponse = Response<CaptureRequest>;


export type AnimeFrameRequest = {
    type: 'anime-frame',
    id: string,
    no: number,
    image: ImageDataUrl,
};
export type AnimeFrameResponse = Response<AnimeFrameRequest>;


export type AnimeEndRequest = CaptureRequestBase & {
    type: 'anime-end',
    id: string,
    interval: number,
};
export type AnimeEndResponse = Response<AnimeEndRequest>;


type AnimeEncodeProgressRequest = {
    type: 'anime-encode-progress',
    progress: number,
};


export type RemoveVideoRequest = {
    type: 'remove-video',
    platform: string,
    videoId: string,
};
export type RemoveVideoResponse = Response<RemoveVideoRequest>;


export type ResetStorageRequest = {
    type: 'reset-storage',
};
export type ResetStorageResponse = Response<ResetStorageRequest>;


export type ShareScreenshotRequest = {
    type: 'share-screenshot',
    video: VideoInfo,
    screenshots: ScreenshotInfo[],
    hashtags: string[],
};


type Response<T extends { type: string }, P = never> = {
    type: `${T['type']}-response`,
} & (P | {
    status: 'complete',
} | {
    status: 'error',
    error: string,
});


// type utils

type OmitAll<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type IsSame<T, U> = T extends U ? U extends T ? true : false : false;
type MapKeys<Map extends [any, any][]> =
    Map extends [[infer Key, any], ...infer Rest]
        ? Key | (Rest extends [any, any][] ? MapKeys<Rest> : never)
        : never;
type MapValues<Map extends [any, any][]> =
    Map extends [[any, infer Value], ...infer Rest]
        ? Value | (Rest extends [any, any][] ? MapValues<Rest> : never)
        : never;
type FindMap<K, M extends [any, any][]> =
    M extends [[infer Key, infer Value], ...infer Rest]
        ? IsSame<K, Key> extends true
            ? Value
            : Rest extends [any, any][]
                ? FindMap<K, Rest>
                : never
        : never
    ;
