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
        const videoUrl = this.getVideoUrl(videoId);
        const defaultThumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

        // トップページから動画ページに遷移した場合などでDOMが不安定になるため、直接動画ページをfetchして情報を取り出す
        const getProperty = (elem: HTMLElement | Document, tag: string, item: string): string | null => elem.querySelector(`${tag}[itemprop="${item}"]`)?.getAttribute('content') ?? null;
        const document = await fetch(videoUrl)
            .then(res => res.text())
            .then(text => new DOMParser().parseFromString(text, 'text/html'));

        const title = getProperty(document, 'meta', 'name');
        const author = getProperty(document, 'link', 'name');
        const thumbnail = getProperty(document, 'link', 'thumbnailUrl');
        const isUnlisted = getProperty(document, 'meta', 'unlisted')?.toLowerCase() === 'true';
        const startDate = getProperty(document, 'meta', 'startDate');

        let isPrivate = isUnlisted;
        let date: Date | null = convertDate(startDate);
        let hashtags: string[] = [];

        const ytInitialData = extractInitialData(document);
        if (ytInitialData) {
            // 初期データのナビゲーション情報からハッシュタグを探す
            hashtags = searchHashtagsFromInitialData(ytInitialData);
            // 公開日時がメタデータから取得できていない場合は初期データから探す
            if (!date) {
                const candidates = searchObjectContainsKey(ytInitialData, 'publishDate');
                for (const c of candidates) {
                    date = convertDate(c.publishDate?.simpleText ?? null);
                    if (date) {
                        break;
                    }
                }
            }
            // 初期データからバッジ情報を取り出して限定公開、メンバー限定かをチェック
            isPrivate ||= searchObjectContainsKey(ytInitialData, 'metadataBadgeRenderer')
                .map(b => b?.metadataBadgeRenderer?.icon?.iconType)
                .some(type => ['PRIVACY_UNLISTED', 'SPONSORSHIP_STAR'].includes(type));
        }

        return {
            title: title ?? '-',
            author: author ?? '-',
            date: date?.getTime() ?? 0,
            thumbnailUrl: thumbnail ?? defaultThumbnailUrl,
            hashtags: hashtags,
            private: isPrivate,
        };
    },
};

function convertDate(value: string | null): Date | null {
    if (!value) {
        return null;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    return d;
}

function extractInitialData(document: Document): object | null {
    const initialScript = Array.from(document.querySelectorAll<HTMLScriptElement>('script')).filter(e => e.text.match(/ytInitialData *=/));
    if (initialScript.length > 0) {
        const initialObject = initialScript[0].text.match(/\{.+}/) || [];
        if (initialObject[0]) {
            return JSON.parse(initialObject[0]);
        }
    }
    return null;
}

function searchObjectContainsKey(obj: any, key: string): any[] {
    const searchObject = (obj: any | any[]) => {
        let result: any[] = [];
        if (Array.isArray(obj)) {
            for (const elem of obj) {
                result = result.concat(searchObject(elem));
            }
        }
        else if (obj instanceof Object) {
            if (key in obj) {
                result.push(obj);
            }
            else {
                for (const value of Object.values(obj)) {
                    if (value instanceof Object) {
                        result = result.concat(searchObject(value));
                    }
                }
            }
        }
        return result;
    }
    return searchObject(obj);
}

function searchHashtagsFromInitialData(ytInitialData: { contents?: object }): string[] {
    const hashtags = searchObjectContainsKey(ytInitialData?.contents ?? {}, 'navigationEndpoint')
        .filter(o => typeof o.text === 'string')
        .map(o => extractHashtags(o.text))
        .flat()
        .reduce((acc, current) => acc.set(current, null), new Map<string, null>())
        .keys();
    return Array.from(hashtags);
}

export default Youtube;