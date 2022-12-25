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


const NicoVideo: Platform = {
    PLATFORM_ID: 'nicovideo',

    getVideoUrl(videoId: string): string {
        // live
        if (videoId.startsWith('lv')) {
            return `https://live.nicovideo.jp/watch/${videoId}`;
        }
        // video
        return `https://www.nicovideo.jp/watch/${videoId}`;
    },

    getVideoPosUrl(videoId: string, pos: number): string | null {
        const t = Math.floor(pos);
        const url = this.getVideoUrl(videoId);
        // live
        if (videoId.startsWith('lv')) {
            // 途中再生や再生位置の移動により撮影時の時間が正しく取れないため無効化
            return null;
            // const s = t % 60;
            // const m = Math.floor(t / 60) % 60;
            // const h = Math.floor(t / 60 / 60);
            // return `${url}#${h}:${m}:${s}`;
        }
        // video
        return `${url}?from=${t}`;
    },

    checkVideoPage(): boolean {
        return document.location.pathname.startsWith('/watch/');
    },

    getVideoId(): string | null {
        return location.pathname.match(/\/watch\/(?<videoId>[^/]+)/)?.groups?.videoId ?? null;
    },

    getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('#MainVideoPlayer video, video') as HTMLVideoElement | null;
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        // live
        if (videoId.startsWith('lv')) {
            const info = JSON.parse((document.querySelector('#embedded-data') as HTMLElement)?.getAttribute('data-props') ?? '{}');
            const thumbnail = info?.program?.thumbnail;
            const thumbnailUrl = thumbnail?.huge?.s1920x1080 ?? thumbnail?.huge?.s1280x720 ?? thumbnail?.huge?.s640x360 ?? thumbnail?.huge?.s352x198;
            return {
                title: info?.program?.title ?? '-',
                author: ((info?.socialGroup?.type === 'channel') ? (info?.socialGroup?.name) : (info?.program?.supplier?.name)) ?? '-',
                date: (info?.program?.beginTime ?? 0) * 1000,
                thumbnailUrl: thumbnailUrl,
                hashtags: info?.program?.twitter?.hashTags ?? [],
                private: false,
            };
        }
        // video
        else {
            const info = JSON.parse((document.querySelector('#js-initial-watch-data') as HTMLElement)?.getAttribute('data-api-data') ?? '{}');
            const thumbnail = info?.video?.thumbnail;
            return {
                title: info?.video?.title ?? '-',
                author: info?.channel?.name ?? info?.owner?.nickname ?? '-',
                date: (new Date(info?.video?.registeredAt ?? 0)).getTime(),
                thumbnailUrl: thumbnail?.ogp ?? thumbnail?.player ?? thumbnail?.largeUrl ?? thumbnail?.middleUrl ?? thumbnail?.url ?? null,
                hashtags: [],
                private: false,
            };
        }
    },
};

export default NicoVideo;
