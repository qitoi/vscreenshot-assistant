/*
 *  Copyright 2022 qitoi
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

let storage: { [key: string]: any } = {};

export async function set(items: { [key: string]: any }): Promise<void> {
    if (chrome.storage.session) {
        return new Promise<void>(resolve => chrome.storage.session.set(items, resolve));
    }
    for (const key of Object.keys(items)) {
        storage[key] = items[key];
    }
}

export async function get(keys: string | string[] | null): Promise<{ [key: string]: any }> {
    if (chrome.storage.session) {
        return new Promise<{ [key: string]: any }>(resolve => chrome.storage.session.get(keys, resolve));
    }

    if (keys === null) {
        return { ...storage };
    }

    if (typeof keys === 'string') {
        keys = [keys];
    }
    const result: { [key: string]: any } = {};
    for (const key of keys) {
        if (key in storage) {
            result[key] = storage[key];
        }
    }
    return result;
}

export async function remove(keys: string | string[]): Promise<void> {
    if (chrome.storage.session) {
        return new Promise<void>(resolve => chrome.storage.session.remove(keys, resolve));
    }
    if (typeof keys === 'string') {
        keys = [keys];
    }
    for (const key of keys) {
        if (key in storage) {
            delete storage[key];
        }
    }
}

export async function clear(): Promise<void> {
    if (chrome.storage.session) {
        return new Promise<void>(resolve => chrome.storage.session.clear(resolve));
    }
    storage = {};
}
