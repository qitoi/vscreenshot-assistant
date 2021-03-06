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

import { Platform, PlatformVideoInfo } from './platform';
import { extractHashtags } from './util';


const Youtube: Platform = {
    PLATFORM_ID: 'youtube',

    getVideoUrl(videoId: string): string {
        return `https://www.youtube.com/watch?v=${videoId}`;
    },

    getVideoPosUrl(videoId: string, pos: number): string | null {
        return this.getVideoUrl(videoId) + `&t=${Math.floor(pos)}s`;
    },

    checkVideoPage(): boolean {
        return document.location.pathname === '/watch';
    },

    getVideoId(): string | null {
        const params = new URLSearchParams(document.location.search);
        return params.get('v');
    },

    getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('video.video-stream') as HTMLVideoElement | null;
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(): Promise<PlatformVideoInfo> {
        const info: any = JSON.parse((document.querySelector('script#scriptTag') as HTMLElement)?.innerText);

        // 動画の公開日時
        let dateStr = null;
        if ('publication' in info) {
            // live streaming / live streaming archive / premiere video
            dateStr = (info.publication || [])[0]?.startDate;
        }
        else {
            // uploaded video
            dateStr = (document.querySelector('div#date>yt-formatted-string') as HTMLElement)?.innerText;
            // member only
            if (dateStr === undefined) {
                dateStr = (document.querySelector('div#info-strings>yt-formatted-string') as HTMLElement)?.innerText;
            }
        }
        const date = (new Date(dateStr)).getTime();

        // anchorタグからハッシュタグを抽出
        const anchors = Array.from(document.querySelectorAll('a[href*="/hashtag/"]')) as HTMLAnchorElement[];
        const hashtags: Record<string, boolean> = {};
        for (const anchor of anchors) {
            const tags = extractHashtags(anchor.textContent ?? '');
            for (const tag of tags) {
                if (tag !== undefined && tag !== '') {
                    hashtags[tag] = true;
                }
            }
        }

        // メンバー限定や限定公開かどうか
        const isPrivate = document.querySelector('ytd-video-primary-info-renderer .ytd-badge-supported-renderer > span') !== null;

        return {
            title: info?.name ?? '-',
            author: info?.author ?? '-',
            date: date,
            thumbnailUrl: (info?.thumbnailUrl ?? [])[0] ?? null,
            hashtags: Object.keys(hashtags),
            private: isPrivate,
        };
    },
};

export default Youtube;
