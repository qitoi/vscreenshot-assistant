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

import * as striptags from 'striptags';

import { Platform, PlatformVideoInfo } from './platform';

const SPWN: Platform = {
    PLATFORM_ID: 'spwn',

    getVideoUrl(videoId: string): string {
        return `https://spwn.jp/events/${videoId}`;
    },

    getVideoPosUrl(): string | null {
        return null;
    },

    checkVideoPage(): boolean {
        return document.location.pathname.substring(document.location.pathname.lastIndexOf('/') + 1) === 'streaming';
    },

    getVideoId(): string | null {
        return document.location.pathname.match(/\/(?<videoId>[^/]*?)\/streaming$/)?.groups?.videoId ?? null;
    },

    getVideoElement(): HTMLVideoElement {
        return document.querySelector('div#video video') as HTMLVideoElement;
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        const resp = await fetch(`https://public.spwn.jp/event-pages/${videoId}/data.json`);
        const info = await resp.json();

        // date
        const d = info.basic_data.startTime.value.split('_')[1].split('-');
        const date = d.slice(0, 3).join('-');
        const time = d[3];
        const datetime = new Date(`${date} ${time}`).getTime();

        return {
            title: info.basic_data.title ?? '-',
            author: striptags(info.basic_data.artists ?? '-'),
            date: datetime,
            thumbnailUrl: `https://public.spwn.jp/event-pages/${videoId}${info.basic_data.banner_img_path}`,
            hashtags: ((info.basic_data.twitterHashTag ?? []) as string[]).filter(t => t !== ''),
            private: false,
        };
    },
};

export default SPWN;
