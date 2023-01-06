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

import * as storage from '../libs/storage';
import * as sessionStorage from '../libs/session-storage';
import { listenAuto } from '../libs/event-listen';


const WINDOW_SIZE_KEY = 'window-size';
type WindowSizeSet = Record<string, { width: number, height: number }>;

export function loadWindowSizeSet(): Promise<WindowSizeSet> {
    return storage.getItemById<WindowSizeSet>(WINDOW_SIZE_KEY, {});
}

export function saveWindowSizeSet(size: WindowSizeSet): Promise<void> {
    return storage.setItems({
        [WINDOW_SIZE_KEY]: size,
    });
}


function getWindowIdKey(name: string): string {
    const SESSION_WINDOW_ID_BY_NAME_PREFIX = 'window-id:';
    return SESSION_WINDOW_ID_BY_NAME_PREFIX + name;
}

function getWindowNameKey(windowId: number): string {
    const SESSION_WINDOW_NAME_BY_ID_PREFIX = 'window-name:';
    return SESSION_WINDOW_NAME_BY_ID_PREFIX + windowId;
}

async function setWindowInfo(name: string, windowId: number): Promise<void> {
    const idKey = getWindowIdKey(name);
    const nameKey = getWindowNameKey(windowId);
    return sessionStorage.set({
        [idKey]: windowId,
        [nameKey]: name,
    });
}

async function clearWindowInfo(windowId: number): Promise<void> {
    const removeKeys = [getWindowNameKey(windowId)];
    const name = await getWindowName(windowId);
    if (name !== null) {
        removeKeys.push(getWindowIdKey(name));
    }
    return sessionStorage.remove(removeKeys);
}

async function getWindowId(name: string): Promise<number | null> {
    const key = getWindowIdKey(name);
    const result = await sessionStorage.get(key);
    return (result[key] as number) ?? null;
}

async function getWindowName(windowId: number): Promise<string | null> {
    const key = getWindowNameKey(windowId);
    const result = await sessionStorage.get(key);
    return (result[key] as string) ?? null;
}

async function createWindow(name: string, url: string): Promise<chrome.windows.Window> {
    const sizeSet = await loadWindowSizeSet();
    const size = (name in sizeSet) ? sizeSet[name] : {};

    const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
        chrome.windows.create({
            type: 'popup',
            url,
            ...size,
        }, window => {
            if (window !== undefined && window.id !== undefined) {
                resolve(window);
            }
            else {
                reject();
            }
        });
    });

    if (window.id !== undefined) {
        const windowId = window.id;
        await setWindowInfo(name, windowId);

        // firefoxはwindow.onBoundsChangedがないため、定期的にウィンドウサイズを取得し保存する
        if (process.env.BROWSER === 'firefox') {
            watchWindowSizeChange(name, windowId);
        }
    }

    return window;
}

async function getWindowById(id: number): Promise<chrome.windows.Window | null> {
    return new Promise<chrome.windows.Window | null>(resolve => {
        chrome.windows.get(id, window => {
            if (chrome.runtime.lastError) {
                resolve(null);
                return;
            }
            resolve(window);
        });
    });
}

export class PopupWindow {
    readonly name: string;
    readonly url: string;
    readonly reuse: boolean;
    private opening: Promise<chrome.windows.Window> | null;

    static create(name: string, url: string, reuse: boolean): PopupWindow {
        return new this(name, url, reuse);
    }

    private constructor(name: string, url: string, reuse: boolean) {
        this.name = name;
        this.url = url;
        this.reuse = reuse;
        this.opening = null;
    }

    async show(): Promise<chrome.windows.Window> {
        if (this.opening !== null) {
            return this.opening;
        }

        this.opening = (async (): Promise<chrome.windows.Window> => {
            if (this.reuse) {
                const windowId = await getWindowId(this.name);
                if (windowId !== null) {
                    const window = await getWindowById(windowId);
                    if (window !== null) {
                        chrome.windows.update(windowId, { focused: true });
                        this.opening = null;
                        return window;
                    }
                }
            }
            const window = await createWindow(this.name, this.url);
            this.opening = null;
            return window;
        })();

        return this.opening;
    }
}

function watchWindowSizeChange(name: string, windowId: number) {
    const id = setInterval(() => {
        chrome.windows.get(windowId, window => {
            // windowが閉じられていれば停止
            if (chrome.runtime.lastError) {
                clearInterval(id);
                return;
            }
            storage.transaction(async () => {
                const size = await loadWindowSizeSet();
                if (window.width !== undefined && window.height !== undefined) {
                    size[name] = { width: window.width, height: window.height };
                }
                return saveWindowSizeSet(size);
            });
        });
    }, 2000);
}

let watched = false;

export function watch(): void {
    if (watched) {
        return;
    }
    watched = true;

    listenAuto(chrome.windows.onRemoved, async windowId => {
        await clearWindowInfo(windowId);
    });

    if (process.env.BROWSER === 'chrome' || process.env.BROWSER === 'edge') {
        listenAuto(chrome.windows.onBoundsChanged, async window => {
            if (window.id !== undefined) {
                const name = await getWindowName(window.id);
                if (name !== null) {
                    await storage.transaction(async () => {
                        const size = await loadWindowSizeSet();
                        if (window.width !== undefined && window.height !== undefined) {
                            size[name] = { width: window.width, height: window.height };
                        }
                        return saveWindowSizeSet(size);
                    });
                }
            }
        });
    }
}
