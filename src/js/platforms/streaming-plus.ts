/*
 *  Copyright 2022 qitoi
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

import { Platform, PlatformVideoInfo } from './platform';

const StreamingPlus: Platform = {
    PLATFORM_ID: 'streaming-plus',

    getVideoUrl(videoId: string): string {
        const [liveId, showId] = videoId.split('/');
        return `https://live.eplus.jp/${liveId}?show_id=${showId}`;
    },

    getVideoPosUrl(videoId: string, pos: number): string | null {
        return null;
    },

    checkVideoPage(): boolean {
        return /^\/\d+$/.test(document.location.pathname);
    },

    getVideoId(): string | null {
        const params = new URLSearchParams(document.location.search);
        const liveId = document.location.pathname.substring(1);
        const showId = params.get('show_id');
        return `${liveId}/${showId}`;
    },

    getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('video');
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(): Promise<PlatformVideoInfo> {
        const title = document.querySelector('.tour-title')?.textContent;
        const dateStr = document.querySelector('.event-date-time')?.textContent ?? '';
        const d = /\d{4}\/\d{1,2}\/\d{1,2}/.exec(dateStr)?.pop();
        const t = /\d{1,2}:\d{1,2}/.exec(dateStr)?.pop();

        let date = 0;
        if (d && t) {
            date = new Date(`${d} ${t}`).getTime();
        }

        return {
            title: title ?? '-',
            author: '-',
            date: date,
            thumbnailUrl: null,
            hashtags: [],
            private: false,
        };
    },
};

export default StreamingPlus;
