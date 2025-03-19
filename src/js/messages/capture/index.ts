/*
 *  Copyright 2023 qitoi
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


import { ImageDataUrl, VideoInfo } from '../../libs/types';


declare module '../type' {
    interface MessageTypes {
        'capture': [CaptureRequest, CaptureResponse];
        'tab-capture-request': [TabCaptureRequestRequest, void];
    }

    interface PortMessageTypes {
        'anime': {
            'anime-frame': [AnimeFrameRequest, void];
            'anime-end': [AnimeEndRequest, CaptureResponse];
            'anime-encode-progress': [AnimeEncodeProgressRequest, void];
        };
    }
}


type OmitAll<T, K extends keyof any> = T extends any ? Omit<T, K> : never;


export type CaptureMessageRequest = CaptureRequest | AnimeEndRequest;
export type CaptureRequestAdditionalType = OmitAll<CaptureMessageRequest, keyof CaptureRequestBase>;


export type CaptureRequestBase = {
    platform: string;
    videoId: string;
    // video
    videoInfo: Omit<VideoInfo, 'platform' | 'videoId' | 'lastUpdated'>;
    thumbnailUrl: string | null;
    // screenshot
    pos: number;
    datetime: number;
};


export type CaptureRequest = CaptureRequestBase & {
    image: ImageDataUrl;
};

export type CaptureResponse = {
    type: 'screenshot';
    platform: string;
    videoId: string;
    no: number;
} | {
    type: 'anime';
    platform: string;
    videoId: string;
    no: number;
    image: string;
}


export type TabCaptureRequestRequest = {};


export type AnimeFrameRequest = {
    id: string;
    no: number;
    image: ImageDataUrl;
};


export type AnimeEndRequest = CaptureRequestBase & {
    id: string;
    interval: number;
};


export type AnimeEncodeProgressRequest = {
    progress: number;
};
