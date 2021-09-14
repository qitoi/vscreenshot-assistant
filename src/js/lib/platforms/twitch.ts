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

function isPopout(location: Location): boolean {
    return location.hostname === 'player.twitch.tv';
}

function isArchive(location: Location): boolean {
    return location.pathname.startsWith('/videos/');
}

function getPopoutVideoId(params: URLSearchParams): string | null {
    const video = params.get('video');
    if (video !== null) {
        return `videos/${video}`;
    }
    const channel = params.get('channel');
    if (channel !== null) {
        return channel;
    }
    return null;
}

function getLiveTime(): number {
    const liveTime = (document.querySelector('.live-time') as HTMLElement | null)?.textContent ?? null;
    if (liveTime !== null) {
        return liveTime.split(':').reduce<number>((prev, current) => prev * 60 + +current, 0) + (new Date()).getMilliseconds() / 1000;
    }
    return 0;
}


const Twitch: Platform = {
    PLATFORM_ID: 'twitch',

    getVideoUrl(videoId: string): string {
        return `https://www.twitch.tv/${videoId}`;
    },

    getVideoPosUrl(videoId: string, pos: number): string | null {
        const t = Math.floor(pos);
        const url = this.getVideoUrl(videoId);
        // archive
        if (videoId.startsWith('videos/')) {
            const s = t % 60;
            const m = Math.floor(t / 60) % 60;
            const h = Math.floor(t / 60 / 60);
            return `${url}?t=${h}h${m}m${s}s`;
        }
        // live
        return null;
    },

    checkVideoPage(): boolean {
        // popout
        if (isPopout(location)) {
            return true;
        }
        // archive
        if (isArchive(location)) {
            return true;
        }
        // popout / archive 以外の場合は配信経過時間が取得できれば live と判定
        const liveTime = document.querySelector('.live-time');
        return liveTime !== null;
    },

    getVideoId(): string | null {
        if (isPopout(location)) {
            return getPopoutVideoId(new URLSearchParams(location.search));
        }
        return location.pathname.match(/\/(?<videoId>(videos\/)?[^/]+)/)?.groups?.videoId ?? null;
    },

    getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('[data-a-target="video-player"] video') as HTMLVideoElement | null;
    },

    getVideoPos(video: HTMLVideoElement): number {
        if (isArchive(location) || isPopout(location)) {
            return video.currentTime;
        }
        return getLiveTime();
    },

    async getVideoInfo(): Promise<PlatformVideoInfo> {
        // popout
        if (isPopout(location)) {
            const title = document.querySelector('[data-a-target="player-info-title"]+*')?.textContent;
            const author = document.querySelector('[data-a-target="player-info-title"]')?.textContent;
            return {
                title: title ?? '-',
                author: author ?? '-',
                date: 0,
                thumbnailUrl: null,
                hashtags: [],
                private: false,
            };
        }
        // live / archive
        else {
            const title = document.querySelector('[data-a-target="stream-title"]')?.textContent;
            const author = document.querySelector('.channel-info-content a[href^="/"] .tw-title')?.textContent;
            let date = 0;
            if (!isArchive(location)) {
                // live の場合は配信経過時間から開始時間を計算
                date = (new Date()).getTime() - getLiveTime() * 1000;
            }
            return {
                title: title ?? '-',
                author: author ?? '-',
                date: date,
                thumbnailUrl: null,
                hashtags: [],
                private: false,
            };
        }
    },
};

export default Twitch;
