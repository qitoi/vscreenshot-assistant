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


const onCloseById: { [key: number]: () => void } = {};
const popupWindowById: { [key: number]: PopupWindow } = {};
const popupWindowByName: { [key: string]: PopupWindow } = {};

export class PopupWindow {
    readonly name: string;
    readonly url: string;
    private window: chrome.windows.Window | null;
    private opening: boolean;

    static create(name: string, url: string, reuse: boolean): PopupWindow {
        if (reuse) {
            if (name in popupWindowByName) {
                return popupWindowByName[name];
            }
        }

        const window = new this(name, url);
        if (reuse) {
            popupWindowByName[name] = window;
        }

        return window;
    }

    private constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
        this.window = null;
        this.opening = false;
    }

    getWindow(): chrome.windows.Window | null {
        return this.window;
    }

    async show(): Promise<void> {
        if (this.opening) {
            return;
        }

        if (this.window !== null && this.window.id !== undefined) {
            chrome.windows.update(this.window.id, { focused: true });
            return;
        }

        this.opening = true;
        const sizeSet = await loadWindowSizeSet();
        const size = (this.name in sizeSet) ? sizeSet[this.name] : {};

        return new Promise((resolve, reject) => {
            chrome.windows.create({
                type: 'popup',
                url: this.url,
                ...size,
            }, window => {
                if (window !== undefined && window.id !== undefined) {
                    this.window = window;
                    this.opening = false;
                    const windowId = window.id;
                    popupWindowById[windowId] = this;
                    onCloseById[windowId] = () => {
                        this.onClose(windowId);
                    };

                    // firefoxはwindow.onBoundsChangedがないため、定期的にウィンドウサイズを取得し保存する
                    if (process.env.BROWSER === 'firefox') {
                        const id = setInterval(() => {
                            chrome.windows.get(windowId, window => {
                                storage.transaction(async () => {
                                    const size = await loadWindowSizeSet();
                                    if (window.width !== undefined && window.height !== undefined) {
                                        size[this.name] = { width: window.width, height: window.height };
                                    }
                                    return saveWindowSizeSet(size);
                                });
                            });
                        }, 2000);
                        const onClose = onCloseById[windowId];
                        onCloseById[windowId] = () => {
                            clearInterval(id);
                            onClose();
                        };
                    }

                    resolve();
                }
                else {
                    reject();
                }
            });
        });
    }

    private onClose(windowId: number) {
        if (windowId in popupWindowById) {
            delete popupWindowByName[popupWindowById[windowId].name];
        }
        delete popupWindowById[windowId];
        delete onCloseById[windowId];
        if (this.window?.id === windowId) {
            this.window = null;
        }
    }
}

let watched = false;

export function watch(): void {
    if (watched) {
        return;
    }
    watched = true;

    listenAuto(chrome.windows.onRemoved, windowId => {
        if (windowId in onCloseById) {
            onCloseById[windowId]();
        }
    });

    if (process.env.BROWSER === 'chrome' || process.env.BROWSER === 'edge') {
        listenAuto(chrome.windows.onBoundsChanged, window => {
            if (window.id !== undefined) {
                if (window.id in popupWindowById) {
                    const popup = popupWindowById[window.id];
                    storage.transaction(async () => {
                        const size = await loadWindowSizeSet();
                        if (window.width !== undefined && window.height !== undefined) {
                            size[popup.name] = { width: window.width, height: window.height };
                        }
                        return saveWindowSizeSet(size);
                    });
                }
            }
        });
    }
}
