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
import { filterHashtags } from "./util";


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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent ?? '{}');
                let keywords = data?.keywords ?? [];
                if (typeof keywords === 'string') {
                    keywords = keywords.split(',');
                }
                if (data['@type'] === 'VideoObject') {
                    console.log('hit');
                    return {
                        title: data?.name ?? '-',
                        author: data?.author?.name ?? '-',
                        date: new Date(data?.uploadDate).getTime(),
                        thumbnailUrl: data?.thumbnailUrl[0] ?? null,
                        hashtags: filterHashtags(keywords),
                        private: false,
                    }
                }
            }
            catch {
                // ignored
            }
        }

        return {
            title: '-',
            author: '-',
            date: 0,
            thumbnailUrl: null,
            hashtags: [],
            private: false,
        }
    },
};

export default NicoVideo;
