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
        const { id, vid } = parseVideoId(videoId);
        if (vid) {
            return `https://spwn.jp/events/${id}/streaming?vid=${vid}`;
        }
        return `https://spwn.jp/events/${id}`;
    },

    getVideoPosUrl(): string | null {
        return null;
    },

    checkVideoPage(): boolean {
        return document.location.pathname.substring(document.location.pathname.lastIndexOf('/') + 1) === 'streaming';
    },

    getVideoId(): string | null {
        const params = new URLSearchParams(document.location.search);
        const id = document.location.pathname.match(/\/(?<videoId>[^/]*?)\/streaming$/)?.groups?.videoId ?? null;
        if (!id) {
            return null;
        }
        const vid = params.get('vid');
        return (vid) ? `${id}/${vid}` : id;
    },

    getVideoElement(): HTMLVideoElement | null {
        // 再生中のプレーヤーがあればそれを採用
        const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[src]')).filter(v => !v.paused);
        if (videos.length > 0) {
            return videos[0];
        }
        // 再生中のものがなく、低遅延プレーヤーが表示されていればそれを採用
        const video = document.querySelector<HTMLVideoElement>('video#aws-video-player');
        if (video !== null && getComputedStyle(video).display !== 'none') {
            return video;
        }
        // それでも見付からなければ最初のプレーヤーを採用
        return document.querySelector<HTMLVideoElement>('video[src]');
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        const { id } = parseVideoId(videoId);
        const resp = await fetch(`https://public.spwn.jp/event-pages/${id}/data.json`);
        if (!resp.ok) {
            const elems = document.querySelectorAll('#Streaming>div>p');

            return {
                title: elems[0]?.textContent ?? '-',
                author: elems[1]?.textContent ?? '-',
                date: 0,
                thumbnailUrl: null,
                hashtags: [],
                private: false,
            };
        }

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
            hashtags: ((info.basic_data.twitterHashTag ?? []) as string[]).filter(t => t !== '').map(t => t.replace(/^#+/, '')),
            private: false,
        };
    },
};

function parseVideoId(videoId: string): { id: string; vid: string | undefined } {
    const [id, vid] = videoId.split('/');
    return { id, vid };
}

export default SPWN;
