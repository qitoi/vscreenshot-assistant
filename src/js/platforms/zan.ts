/*
 *  Copyright 2023 qitoi
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

const ZaN: Platform = {
    PLATFORM_ID: 'zan',

    getVideoUrl(videoId: string): string {
        return `https://www.zan-live.com/live/play/${videoId}`;
    },

    getVideoPosUrl(): string | null {
        return null;
    },

    checkVideoPage(): boolean {
        return document.location.pathname.startsWith('/live/play/');
    },

    getVideoId(): string | null {
        return document.location.pathname.match(/\/live\/play\/(?<videoId>[0-9]+\/[0-9]+)/)?.groups?.videoId ?? null;
    },

    getVideoElement(): HTMLVideoElement | null {
        // 再生中のプレーヤーがあればそれを採用
        const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[src]')).filter(v => !v.paused);
        if (videos.length > 0) {
            return videos[0];
        }
        // それでも見付からなければ最初のプレーヤーを採用
        return document.querySelector<HTMLVideoElement>('video');
    },

    getVideoPos(video: HTMLVideoElement): number {
        return video.currentTime;
    },

    async getVideoInfo(videoId: string): Promise<PlatformVideoInfo> {
        const videoUrl = this.getVideoUrl(videoId);
        const document = await fetch(videoUrl)
            .then(res => res.text())
            .then(text => new DOMParser().parseFromString(text, 'text/html'));

        const tickets = getTicketInfo(document);
        const ticketInfo = findTicketInfo(videoId, tickets);

        const title =
            decodeHTMLEntity(ticketInfo?.liveName) ??
            getMetaContent(document, 'live-name') ??
            document.querySelector<HTMLElement>('#kafTitle01')?.textContent ??
            '-';

        const d = ticketInfo?.liveBeginDate ?? getMetaContent(document, 'open-live-date') ?? null;
        const datetime = (d !== null) ? new Date(d).getTime() : 0;

        const hashtags = getHashtags(ticketInfo);

        const thumbnail = document.querySelector<HTMLImageElement>('.phoImg>img')?.src ?? null;

        return {
            title: title,
            author: '-',
            date: datetime,
            thumbnailUrl: thumbnail,
            hashtags: hashtags,
            private: false,
        };
    },
};

function getTicketInfo(document: Document): any[] {
    const scripts = document.querySelectorAll('script');
    const targetScript = Array.from(scripts).filter(e => /liveTickets.*JSON\.parse/m.test(e.textContent ?? ''))[0] ?? null;
    const ticketJson = (targetScript?.textContent ?? '').match(/liveTickets.*JSON\.parse\(['`](?<json>.*)['`]\)/m)?.groups?.json;
    return ticketJson ? JSON.parse(ticketJson) : [];
}

function findTicketInfo(videoId: string, tickets: any[]): any {
    const [id, liveId] = videoId.split('/');
    return tickets.find(t => ('' + t.id) === id && ('' + t.liveId) === liveId);
}

function getHashtags(ticketInfo: any): string[] {
    const ht = ticketInfo?.sns?.hashTags;
    if (typeof ht === 'string') {
        return [ht];
    }
    else if (Array.isArray(ht)) {
        return ht;
    }
    return [];
}

function decodeHTMLEntity(s: string | null): string | null {
    if (s === null) {
        return null;
    }
    const div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent ?? '';
}

function getMetaContent(document: Document, name: string): string | null {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null;
}

export default ZaN;
