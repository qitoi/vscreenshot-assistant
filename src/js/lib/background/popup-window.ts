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

let windowById: { [key: number]: PopupWindow } = {};
let onCloseById: { [key: number]: () => void } = {};
let windowByName: { [key: string]: PopupWindow } = {};

export default class PopupWindow {
    readonly name: string;
    readonly url: string;
    private window: chrome.windows.Window | null;
    private opening: boolean;

    static create(name: string, url: string): PopupWindow {
        if (name in windowByName) {
            return windowByName[name];
        }
        return new this(name, url);
    }

    private constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
        this.window = null;
        this.opening = false;
        windowByName[name] = this;
    }

    getWindow(): chrome.windows.Window | null {
        return this.window;
    }

    show() {
        if (this.opening) {
            return;
        }

        if (this.window !== null) {
            chrome.windows.update(this.window.id!, { focused: true });
            return;
        }

        this.opening = true;
        loadWindowSize(this.name)
            .then(size => {
                chrome.windows.create({
                    type: 'popup',
                    url: this.url,
                    width: size.width,
                    height: size.height,
                }, window => {
                    if (window) {
                        this.window = window;
                        this.opening = false;
                        const windowId = window.id!;
                        windowById[windowId] = this;
                        onCloseById[windowId] = () => {
                            this.onClose(windowId);
                        };
                    }
                });
            });
    }

    private onClose(windowId: number) {
        delete windowById[windowId];
        delete onCloseById[windowId];
        if (this.window?.id === windowId) {
            this.window = null;
        }
    }
}

chrome.windows.onRemoved.addListener(windowId => {
    if (windowId in onCloseById) {
        onCloseById[windowId]();
    }
});

chrome.windows.onBoundsChanged.addListener(window => {
    if (window.id !== undefined) {
        if (window.id in windowById) {
            saveWindowSize(windowById[window.id].name, window.width!, window.height!);
        }
    }
});

function loadWindowSize(name: string): Promise<{ width: number, height: number }> {
    const WINDOW_SIZE_KEY = `window:size:${name}`;
    return new Promise(resolve => {
        chrome.storage.local.get(
            { [WINDOW_SIZE_KEY]: { width: null, height: null } },
            items => {
                resolve(items[WINDOW_SIZE_KEY] as { width: number, height: number });
            });
    });
}

function saveWindowSize(name: string, width: number, height: number): Promise<void> {
    const WINDOW_SIZE_KEY = `window:size:${name}`;
    return new Promise(resolve => {
        chrome.storage.local.set(
            { [WINDOW_SIZE_KEY]: { width, height } },
            () => resolve()
        );
    });
}
