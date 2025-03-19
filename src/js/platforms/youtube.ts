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
        const pathname = document.location.pathname;
        return (pathname === '/watch') || isShorts(pathname) || isLive(pathname);
    },

    getVideoId(): string | null {
        const pathname = document.location.pathname;
        if (isShorts(pathname)) {
            return pathname.substring('/shorts/'.length);
        }
        if (isLive(pathname)) {
            return pathname.substring('/live/'.length);
        }
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
        const getProperty = (elem: HTMLElement | Document, tag: string, item: string, value: string): string | null => elem.querySelector(`${tag}[itemprop="${item}"]`)?.getAttribute(value) ?? null;
        const document = await fetch(videoUrl)
            .then(res => res.text())
            .then(text => new DOMParser().parseFromString(text, 'text/html'));

        const title = getProperty(document, 'meta', 'name', 'content');
        const author = getProperty(document, 'link', 'name', 'content');
        const thumbnail = getProperty(document, 'link', 'thumbnailUrl', 'href');
        const isUnlisted = getProperty(document, 'meta', 'unlisted', 'content')?.toLowerCase() === 'true';
        const startDate = getProperty(document, 'meta', 'startDate', 'content');

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
            isPrivate ||= searchObjectContainsKey(ytInitialData?.contents?.twoColumnWatchNextResults?.results ?? {}, 'metadataBadgeRenderer')
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

function isShorts(pathname: string): boolean {
    return pathname.startsWith('/shorts/');
}

function isLive(pathname: string): boolean {
    return pathname.startsWith('/live/');
}

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

function extractInitialData(document: Document): any {
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
    const hashtags = [
        // ファーストビューで表示される範囲のリンク文字列を探す
        ...searchObjectContainsKey(ytInitialData?.contents ?? {}, 'navigationEndpoint')
            .filter(o => typeof o.text === 'string')
            .map(o => extractHashtags(o.text))
            .flat(),
        // 折り畳まれた概要欄中のURLを探して抜き出す
        ...searchObjectContainsKey(ytInitialData?.contents ?? {}, 'url')
            .filter(o => o.url.startsWith('/hashtag/'))
            .map(o => decodeURI(o.url.substring('/hashtag/'.length)))
    ];
    const uniqueHashtags = hashtags
        .reduce((acc, current) => acc.set(current, null), new Map<string, null>())
        .keys();
    return Array.from(uniqueHashtags);
}

export default Youtube;
