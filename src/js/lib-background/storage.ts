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

import { ImageDataUrl, ScreenshotInfo, VideoInfo } from '../lib/types';


// video keys

const VIDEO_KEYMAP_KEY = 'video-keys';

type VideoKeyMap = {
    [id: string]: number,
};
type VideoKey = [platform: string, id: string];

function getVideoPrimaryKeys(): Promise<VideoKey[]> {
    return execInSequence(async () => {
        const keymap = await getItemById<VideoKeyMap>(VIDEO_KEYMAP_KEY, {});
        return Object.keys(keymap).map(k => k.split(':') as VideoKey);
    });
}

function registerVideo(platform, id: string): Promise<void> {
    return execInSequence(async () => {
        const keymap = await getItemById<VideoKeyMap>(VIDEO_KEYMAP_KEY, {});
        keymap[`${platform}:${id}`] = 1;
        await setItems({ [VIDEO_KEYMAP_KEY]: keymap });
    });
}

function unregisterVideo(platform, id: string): Promise<void> {
    return execInSequence(async () => {
        const keymap = await getItemById<VideoKeyMap>(VIDEO_KEYMAP_KEY, {});
        delete keymap[`${platform}:${id}`];
        await setItems({ [VIDEO_KEYMAP_KEY]: keymap });
    });
}


// video info

export async function getVideoInfoList(): Promise<VideoInfo[]> {
    const pks = await getVideoPrimaryKeys();
    const ids = pks.map(([platform, id]) => getVideoInfoId(platform, id));
    return getItemListByIds<VideoInfo>(ids);
}

export async function saveVideoInfo(platform, videoId, title, author: string, priv: boolean, ratio: number, thumbnail: ImageDataUrl, videoDate, lastUpdated: number): Promise<void> {
    const infoId = getVideoInfoId(platform, videoId);
    const thumbId = getVideoThumbnailId(platform, videoId);
    const info: VideoInfo = {
        platform: platform,
        videoId: videoId,
        title: title,
        author: author,
        private: priv,
        ratio: ratio,
        date: videoDate,
        lastUpdated: lastUpdated,
    };
    await setItems({
        [infoId]: info,
        [thumbId]: thumbnail,
    });
    return registerVideo(platform, videoId);
}

export async function removeVideoInfo(platform, videoId: string): Promise<void> {
    // video info/thumbnail ids
    const infoId = getVideoInfoId(platform, videoId);
    const thumbId = getVideoThumbnailId(platform, videoId);
    let ids: string[] = [infoId, thumbId];

    // screenshot info/thumbnail/image ids
    const maxNo = await getPublishedScreenshotNo(platform, videoId);
    for (let i = 1; i <= maxNo; ++i) {
        ids.push(getScreenshotInfoId(platform, videoId, i));
        ids.push(getScreenshotThumbnailId(platform, videoId, i));
        ids.push(getScreenshotId(platform, videoId, i));
    }

    await Promise.all([
        unregisterVideo(platform, videoId),
        removePublishedScreenshotNo(platform, videoId),
        removeItems(ids),
    ]);
}


// screenshot info

async function getScreenshotInfoIdList(platform, videoId: string): Promise<string[]> {
    const maxNo = await getPublishedScreenshotNo(platform, videoId);
    let ids: string[] = [];
    for (let i = 1; i <= maxNo; ++i) {
        ids.push(getScreenshotInfoId(platform, videoId, i));
    }
    return ids;
}

export async function saveScreenshot(platform, videoId: string, image, thumbnail: ImageDataUrl, pos, datetime: number): Promise<void> {
    const no = await publishScreenshotNo(platform, videoId);
    const infoId = getScreenshotInfoId(platform, videoId, no);
    const thumbId = getScreenshotThumbnailId(platform, videoId, no);
    const screenshotId = getScreenshotId(platform, videoId, no);
    const info: ScreenshotInfo = { platform, videoId, no, pos, datetime };
    return setItems({
        [infoId]: info,
        [thumbId]: thumbnail,
        [screenshotId]: image,
    });
}

export async function getScreenshotInfoList(platform, videoId: string): Promise<ScreenshotInfo[]> {
    const ids = await getScreenshotInfoIdList(platform, videoId);
    return getItemListByIds(ids);
}


// screenshot image

export async function getVideoThumbnail(platform, videoId: string): Promise<ImageDataUrl> {
    const id = getVideoThumbnailId(platform, videoId);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshotThumbnail(platform, videoId: string, no: number): Promise<ImageDataUrl> {
    const id = getScreenshotThumbnailId(platform, videoId, no);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshot(platform, videoId: string, no: number): Promise<ImageDataUrl> {
    const id = getScreenshotId(platform, videoId, no);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshotList(infoList: ScreenshotInfo[]): Promise<ImageDataUrl[]> {
    const ids = infoList.map(s => getScreenshotId(s.platform, s.videoId, s.no));
    return getItemMapByIds<ImageDataUrl>(ids).then(images => ids.map((id) => images[id]));
}


// screenshot no

async function publishScreenshotNo(platform, videoId: string): Promise<number> {
    const id = getScreenshotNoId(platform, videoId);
    return execInSequence(async () => {
        const no = await getItemById<number>(id, 0) + 1;
        await setItems({ [id]: no });
        return no;
    });
}

async function getPublishedScreenshotNo(platform, videoId: string): Promise<number> {
    const id = getScreenshotNoId(platform, videoId);
    return getItemById<number>(id, 0);
}

async function removePublishedScreenshotNo(platform, videoId: string): Promise<void> {
    const id = getScreenshotNoId(platform, videoId);
    return removeItems([id]);
}


// object id

function getVideoInfoId(platform, videoId: string): string {
    return `v:i:${platform}:${videoId}`;
}

function getVideoThumbnailId(platform, videoId: string): string {
    return `v:t:${platform}:${videoId}`;
}

function getScreenshotNoId(platform, videoId: string): string {
    return `v:n:${platform}:${videoId}`;
}

function getScreenshotInfoId(platform, videoId: string, no: number): string {
    return `s:i:${platform}:${videoId}:${no}`;
}

function getScreenshotThumbnailId(platform, videoId: string, no: number): string {
    return `s:t:${platform}:${videoId}:${no}`;
}

function getScreenshotId(platform, videoId: string, no: number): string {
    return `s:s:${platform}:${videoId}:${no}`;
}


// util

function getItemById<T>(id: string, defaultVal: any = null): Promise<T> {
    return new Promise(resolve => {
        chrome.storage.local.get({ [id]: defaultVal }, items => {
            resolve(items[id] ?? null as T);
        });
    });
}

export function getItemMapByIds<T>(ids: string[]): Promise<{ [id: string]: T }> {
    return new Promise(resolve => {
        chrome.storage.local.get(ids, items => {
            resolve(items);
        });
    });
}

export function getItemListByIds<T>(ids: string[]): Promise<T[]> {
    return new Promise(resolve => {
        chrome.storage.local.get(ids, items => {
            resolve(Object.values(items as { [id: string]: T }));
        });
    });
}

function setItems(params: { [id: string]: any }): Promise<void> {
    return new Promise(resolve => {
        chrome.storage.local.set(params, () => {
            resolve();
        });
    });
}

function removeItems(ids: string[]): Promise<void> {
    return new Promise(resolve => {
        chrome.storage.local.remove(ids, () => {
            resolve();
        });
    });
}

export function clearAll(): Promise<void> {
    return new Promise(resolve => {
        chrome.storage.local.clear(() => resolve);
    });
}

let current: Promise<any> = Promise.resolve();

function execInSequence<T>(f: () => Promise<T>): Promise<T> {
    current = current.then(f);
    return current;
}
