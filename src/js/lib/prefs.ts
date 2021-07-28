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

import * as storage from './storage';


const PREFERENCES_KEY = 'preferences';

const FileTypes = ['image/jpeg', 'image/png'] as const;
export type FileType = typeof FileTypes[number];
const isFileType = (type: any): type is FileType => FileTypes.some(t => t === type);

export type Preferences = {
    general: {},
    screenshot: {
        fileType: FileType,
        quality: number,
    },
    thumbnail: {
        width: number,
        height: number,
    },
    tweet: {
        tweetUrl: boolean,
        tweetTitle: boolean,
        tweetAuthor: boolean,
    },
};

export const DefaultPreferences: Preferences = {
    general: {},
    screenshot: {
        fileType: 'image/jpeg',
        quality: 0.96,
    },
    thumbnail: {
        width: 320,
        height: 180,
    },
    tweet: {
        tweetUrl: true,
        tweetTitle: true,
        tweetAuthor: false,
    },
};

function completePreferences(prefs: Preferences): Preferences {
    const completeFileType = (type?: string): FileType => isFileType(type) ? type : DefaultPreferences.screenshot.fileType;
    return {
        general: {},
        screenshot: {
            fileType: completeFileType(prefs?.screenshot?.fileType),
            quality: Math.min(Math.max(+(prefs?.screenshot?.quality ?? DefaultPreferences.screenshot.quality), 0.01), 1.00),
        },
        thumbnail: {
            width: Math.min(Math.max(+(prefs?.thumbnail?.width ?? DefaultPreferences.thumbnail.width), 1), 9999),
            height: Math.min(Math.max(+(prefs?.thumbnail?.height ?? DefaultPreferences.thumbnail.height), 1), 9999),
        },
        tweet: {
            tweetUrl: Boolean(prefs?.tweet?.tweetUrl ?? DefaultPreferences.tweet.tweetUrl),
            tweetTitle: Boolean(prefs?.tweet?.tweetTitle ?? DefaultPreferences.tweet.tweetTitle),
            tweetAuthor: Boolean(prefs?.tweet?.tweetAuthor ?? DefaultPreferences.tweet.tweetAuthor),
        },
    };
}


export async function loadPreferences(): Promise<Preferences> {
    if (currentPreferences !== null) {
        return Promise.resolve(currentPreferences);
    }
    return storage.getItemById<Preferences>(PREFERENCES_KEY).then(prefs => completePreferences(prefs));
}

export async function savePreferences(prefs: Preferences): Promise<void> {
    return storage.setItems({ [PREFERENCES_KEY]: completePreferences(prefs) });
}


interface PreferencesEvent {
    addEventListener: (callback: (prefs: Preferences) => void) => void;
    removeEventListener: (callback: (prefs: Preferences) => void) => void;
}

let onChanged: PreferencesEvent | null = null;

export function watch(): PreferencesEvent {
    if (onChanged !== null) {
        return onChanged;
    }

    const prefsEvent = new class implements PreferencesEvent {
        callbacks: ((prefs: Preferences) => void)[] = [];

        addEventListener(callback: (prefs: Preferences) => void) {
            this.callbacks.push(callback);
        }

        removeEventListener(callback: (prefs: Preferences) => void) {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        }

        dispatch(prefs: Preferences) {
            for (const cb of this.callbacks) {
                cb(prefs);
            }
        }
    };

    loadPreferences().then(prefs => {
        currentPreferences = completePreferences(prefs);
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') {
            return;
        }
        for (const [key, change] of Object.entries(changes)) {
            if (key === PREFERENCES_KEY) {
                if ('newValue' in change) {
                    currentPreferences = completePreferences(change.newValue as Preferences);
                }
                else {
                    currentPreferences = DefaultPreferences;
                }
                prefsEvent.dispatch(currentPreferences);
                break;
            }
        }
    });

    onChanged = prefsEvent;
    return prefsEvent;
}

let currentPreferences: Preferences | null = null;
