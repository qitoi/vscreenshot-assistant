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

export type PlatformVideoInfo = {
    title: string,
    author: string,
    date: number,
    thumbnailUrl: string | null,
    hashtags: string[],
    private: boolean,
};

export interface Platform {
    readonly PLATFORM_ID: string;

    getVideoUrl(videoId: string): string;

    getVideoPosUrl(videoId: string, pos: number): string | null;

    checkVideoPage(): boolean;

    getVideoId(): string | null;

    getVideoElement(): HTMLVideoElement;

    getVideoPos(video: HTMLVideoElement): number;

    getVideoInfo(videoId: string): Promise<PlatformVideoInfo>;
}
