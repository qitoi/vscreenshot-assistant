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
import { extractHashtags } from './util';

const FCTypes = {
    Hololive: 'hololive-fc.com',
    TokinoSora: 'tokinosora-fc.com',
} as const;
type FCType = typeof FCTypes[keyof typeof FCTypes];

const FCDomains = Object.values(FCTypes).join('|');

function getFCType(videoId: string): FCType {
    if (videoId.startsWith(`${FCTypes.TokinoSora}/`)) {
        return FCTypes.TokinoSora;
    }
    return FCTypes.Hololive;
}

function getFCName(type: FCType): string {
    if (type === FCTypes.TokinoSora) {
        return 'ときのそらオフィシャルファンクラブ';
    }
    return 'ホロライブ公式ファンクラブ';
}

const HololiveFC: Platform = {
    PLATFORM_ID: 'hololive-fc',

    getVideoUrl(videoId: string): string {
        return `https://${videoId}`;
    },

    getVideoPosUrl(): string | null {
        return null;
    },

    checkVideoPage(): boolean {
        const host = document.location.host;
        const pathname = document.location.pathname;
        return (host === FCTypes.Hololive || host === FCTypes.TokinoSora) && (pathname.startsWith('/live/') || pathname.startsWith('/video/'));
    },

    getVideoId(): string | null {
        return document.location.href.match(new RegExp(`/(?<videoId>(${FCDomains})/(live|video)/[^/]+)`))?.groups?.videoId ?? null;
    },

    getVideoElement(): HTMLVideoElement | null {
        return document.querySelector<HTMLVideoElement>('video');
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        const vid = videoId.split('/').pop();
        const fcType = getFCType(videoId);
        const resp = await fetch(`https://nfc-api.${fcType}/fc/video_pages/${vid}`);
        const info = await resp.json();
        const videoInfo = info?.data?.video_page;

        const d = videoInfo?.live_started_at ?? videoInfo?.live_scheduled_start_at ?? videoInfo.released_at ?? null;
        const datetime = (d !== null) ? new Date(d + 'Z').getTime() : 0;

        // タイトルからハッシュタグを抽出
        const hashtags: Record<string, boolean> = {};
        const tags = extractHashtags(videoInfo.title ?? '');
        for (const tag of tags) {
            if (tag !== undefined && tag !== '') {
                hashtags[tag] = true;
            }
        }
        for (const t of videoInfo?.video_tags ?? []) {
            hashtags[t.tag] = true;
        }

        return {
            title: videoInfo.title ?? '-',
            author: getFCName(fcType),
            date: datetime,
            thumbnailUrl: videoInfo.thumbnail_url ?? null,
            hashtags: Object.keys(hashtags),
            private: true,
        };
    },
};

export default HololiveFC;
