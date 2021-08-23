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

import { ImageDataUrl, ScreenshotInfo, VideoInfo } from './types';


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

function registerVideo(platform: string, id: string): Promise<void> {
    return execInSequence(async () => {
        const keymap = await getItemById<VideoKeyMap>(VIDEO_KEYMAP_KEY, {});
        keymap[`${platform}:${id}`] = 1;
        await setItems({ [VIDEO_KEYMAP_KEY]: keymap });
    });
}

function unregisterVideo(platform: string, id: string): Promise<void> {
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

export async function saveVideoInfo(info: VideoInfo): Promise<void> {
    const infoId = getVideoInfoId(info.platform, info.videoId);
    await setItems({
        [infoId]: info,
    });
    return registerVideo(info.platform, info.videoId);
}

export async function removeVideoInfo(platform: string, videoId: string): Promise<void> {
    // video info/thumbnail ids
    const infoId = getVideoInfoId(platform, videoId);
    const thumbId = getVideoThumbnailId(platform, videoId);
    const hashtagsId = getVideoSelectedHashtagsId(platform, videoId);
    const ids: string[] = [infoId, thumbId, hashtagsId];

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

export async function saveVideoThumbnail(platform: string, videoId: string, thumbnail: ImageDataUrl): Promise<void> {
    const thumbId = getVideoThumbnailId(platform, videoId);
    return setItems({
        [thumbId]: thumbnail,
    });
}

export async function existsVideoThumbnail(platform: string, videoId: string): Promise<boolean> {
    const thumbId = getVideoThumbnailId(platform, videoId);
    return existsItem(thumbId);
}

export async function getVideoSelectedHashtags(platform: string, videoId: string): Promise<string[]> {
    const hashtagsId = getVideoSelectedHashtagsId(platform, videoId);
    return getItemById<string[] | undefined>(hashtagsId)
        .then(hashtags => hashtags ?? []);
}

export async function saveVideoSelectedHashtags(platform: string, videoId: string, hashtags: string[]): Promise<void> {
    const hashtagsId = getVideoSelectedHashtagsId(platform, videoId);
    return setItems({
        [hashtagsId]: hashtags,
    });
}


// screenshot info

async function getScreenshotInfoIdList(platform: string, videoId: string): Promise<string[]> {
    const maxNo = await getPublishedScreenshotNo(platform, videoId);
    const ids: string[] = [];
    for (let i = 1; i <= maxNo; ++i) {
        ids.push(getScreenshotInfoId(platform, videoId, i));
    }
    return ids;
}

export async function saveScreenshot(platform: string, videoId: string, anime: boolean, pos: number, datetime: number, image: ImageDataUrl, thumbnail: ImageDataUrl): Promise<void> {
    const no = await publishScreenshotNo(platform, videoId);
    const infoId = getScreenshotInfoId(platform, videoId, no);
    const thumbId = getScreenshotThumbnailId(platform, videoId, no);
    const screenshotId = getScreenshotId(platform, videoId, no);
    const info: ScreenshotInfo = { platform, videoId, no, anime, pos, datetime };
    return setItems({
        [infoId]: info,
        [thumbId]: thumbnail,
        [screenshotId]: image,
    });
}

export async function getScreenshotInfoList(platform: string, videoId: string): Promise<ScreenshotInfo[]> {
    const ids = await getScreenshotInfoIdList(platform, videoId);
    return getItemListByIds(ids);
}


// screenshot image

export async function getVideoThumbnail(platform: string, videoId: string): Promise<ImageDataUrl> {
    const id = getVideoThumbnailId(platform, videoId);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshotThumbnail(platform: string, videoId: string, no: number): Promise<ImageDataUrl> {
    const id = getScreenshotThumbnailId(platform, videoId, no);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshot(platform: string, videoId: string, no: number): Promise<ImageDataUrl> {
    const id = getScreenshotId(platform, videoId, no);
    return getItemById<ImageDataUrl>(id);
}

export async function getScreenshotList(infoList: ScreenshotInfo[]): Promise<ImageDataUrl[]> {
    const ids = infoList.map(s => getScreenshotId(s.platform, s.videoId, s.no));
    return getItemMapByIds<ImageDataUrl>(ids).then(images => ids.map((id) => images[id]));
}


// screenshot no

async function publishScreenshotNo(platform: string, videoId: string): Promise<number> {
    const id = getScreenshotNoId(platform, videoId);
    return execInSequence(async () => {
        const no = await getItemById<number>(id, 0) + 1;
        await setItems({ [id]: no });
        return no;
    });
}

async function getPublishedScreenshotNo(platform: string, videoId: string): Promise<number> {
    const id = getScreenshotNoId(platform, videoId);
    return getItemById<number>(id, 0);
}

async function removePublishedScreenshotNo(platform: string, videoId: string): Promise<void> {
    const id = getScreenshotNoId(platform, videoId);
    return removeItems([id]);
}


// object id

function getVideoInfoId(platform: string, videoId: string): string {
    return `v:i:${platform}:${videoId}`;
}

function getVideoThumbnailId(platform: string, videoId: string): string {
    return `v:t:${platform}:${videoId}`;
}

function getVideoSelectedHashtagsId(platform: string, videoId: string): string {
    return `v:h:${platform}:${videoId}`;
}

function getScreenshotNoId(platform: string, videoId: string): string {
    return `v:n:${platform}:${videoId}`;
}

function getScreenshotInfoId(platform: string, videoId: string, no: number): string {
    return `s:i:${platform}:${videoId}:${no}`;
}

function getScreenshotThumbnailId(platform: string, videoId: string, no: number): string {
    return `s:t:${platform}:${videoId}:${no}`;
}

function getScreenshotId(platform: string, videoId: string, no: number): string {
    return `s:s:${platform}:${videoId}:${no}`;
}


// util

export function getItemById<T>(id: string, defaultVal: any = null): Promise<T> {
    return new Promise(resolve => {
        chrome.storage.local.get({ [id]: defaultVal }, items => {
            resolve(items[id] ?? null as T | null);
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

export function setItems(params: { [id: string]: any }): Promise<void> {
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

function existsItem(id: string): Promise<boolean> {
    return new Promise(resolve => {
        chrome.storage.local.getBytesInUse(id, bytes => resolve(bytes > 0));
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
