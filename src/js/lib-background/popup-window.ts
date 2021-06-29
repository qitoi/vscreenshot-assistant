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

type WindowDisposer = () => void;

let windowById: { [key: number]: PopupWindow } = {};
let windowByName: { [key: string]: PopupWindow } = {};
let disposeByName: { [key: string]: WindowDisposer } = {};

export default class PopupWindow {
    public readonly name: string;
    public readonly url: string;
    private window: chrome.windows.Window;

    static create(name: string, url: string): PopupWindow {
        if (name in windowByName) {
            return windowByName[name];
        }

        const w = new this(name, url);
        windowByName[name] = w;
        disposeByName[name] = () => {
            w.dispose();
        };
        return w;
    }

    private constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
        this.window = null;
    }

    getWindow(): chrome.windows.Window {
        return this.window;
    }

    show() {
        if (this.window !== null) {
            chrome.windows.update(this.window.id, { focused: true });
            return;
        }

        loadWindowSize(this.name)
            .then(size => {
                chrome.windows.create({
                    type: 'popup',
                    url: this.url,
                    width: size.width,
                    height: size.height,
                }, window => {
                    this.window = window;
                    windowById[window.id] = this;
                });
            });
    }

    private dispose() {
        if (this.window !== null) {
            delete windowById[this.window.id];
            this.window = null;
        }
    }
}

chrome.windows.onRemoved.addListener(windowId => {
    const name = windowById[windowId]?.name;
    if (name in disposeByName) {
        disposeByName[name]();
    }
});

chrome.windows.onBoundsChanged.addListener(window => {
    const name = windowById[window.id]?.name;
    if (name !== null) {
        saveWindowSize(name, window.width, window.height);
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
