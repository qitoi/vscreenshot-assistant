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
        return document.querySelector<HTMLVideoElement>('video.video-stream[src]');
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        let info: any = JSON.parse(document.querySelector<HTMLElement>('script#scriptTag')?.innerText ?? 'null');

        // トップから動画ページに遷移した場合、動画のメタデータが取得できないため、動画ページを直接 fetch してメタデータを取り出す
        const getProperty = (elem: HTMLElement | Document, tag: string, item: string) => elem.querySelector(`${tag}[itemprop="${item}"]`)?.getAttribute('content');
        if (info === null) {
            info = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
                .then(res => res.text())
                .then(text => new DOMParser().parseFromString(text, 'text/html'))
                .then(document => ({
                    name: getProperty(document, 'meta', 'name'),
                    author: getProperty(document, 'link', 'name'),
                    publication: [
                        { startDate: getProperty(document, 'meta', 'startDate') }
                    ],
                }));
        }

        // 動画の公開日時
        let dateStr = null;
        if ('publication' in info) {
            // live streaming / live streaming archive / premiere video
            dateStr = (info.publication || [])[0]?.startDate;
        }
        if (!dateStr) {
            // uploaded video
            dateStr = (document.querySelector<HTMLElement>('div#date>yt-formatted-string'))?.innerText;
            // member only
            if (dateStr === undefined) {
                dateStr = (document.querySelector<HTMLElement>('div#info-strings>yt-formatted-string'))?.innerText;
            }
        }
        const date = (new Date(dateStr)).getTime();

        // anchorタグからハッシュタグを抽出
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/hashtag/"]'));
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
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            hashtags: Object.keys(hashtags),
            private: isPrivate,
        };
    },
};

export default Youtube;
