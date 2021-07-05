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

import Platform from './platform';

const Youtube: Platform = {
    PLATFORM_ID: 'youtube',

    getVideoUrl(videoId: string): string {
        return `https://www.youtube.com/watch?v=${videoId}`;
    },

    checkVideoPage(): boolean {
        return document.location.pathname === '/watch';
    },

    getVideoId(): string {
        const params = new URLSearchParams(document.location.search);
        return params.get('v');
    },

    getVideoElement(): HTMLVideoElement {
        return document.querySelector('video.video-stream') as HTMLVideoElement;
    },

    async initVideoInfo(videoId: string): Promise<any> {
        return new Promise(resolve => {
            resolve(JSON.parse((document.querySelector('script#scriptTag') as HTMLElement)?.innerText));
        });
    },

    getVideoDate(videoId: string, info: any): number {
        let dateStr = null;
        if ('publication' in info) {
            // live streaming / live streaming archive / premiere video
            dateStr = (info.publication || [])[0]?.startDate;
        }
        else {
            // uploaded video
            dateStr = (document.querySelector('div#date>yt-formatted-string') as HTMLElement)?.innerText;
            // member only
            if (dateStr === void 0) {
                dateStr = (document.querySelector('div#info-strings>yt-formatted-string') as HTMLElement)?.innerText;
            }
        }
        return (dateStr !== null) ? (new Date(dateStr)).getTime() : null;
    },

    getVideoThumbnailUrl(videoId: string, info: any): string {
        return (info?.thumbnailUrl ?? [])[0] ?? null;
    },

    getVideoTitle(videoId: string, info: any): string {
        return info?.name;
    },

    getAuthor(videoId: string, info: any): string {
        return info?.author;
    },

    isPrivate(videoId: string, info: any): boolean {
        const label = (document.querySelector('ytd-video-primary-info-renderer .ytd-badge-supported-renderer > span') as HTMLElement)?.innerText;
        return label !== void 0;
    },
};

export default Youtube;
