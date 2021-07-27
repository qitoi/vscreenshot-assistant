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

// preference

export const PREFERENCES_KEY = 'preferences';


export type Preferences = {
    general: {},
    screenshot: {
        fileType: 'jpeg' | 'png',
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
        fileType: 'jpeg',
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


export async function loadPreferences(): Promise<Preferences> {
    if (currentPreferences !== null) {
        return Promise.resolve(currentPreferences);
    }
    return storage.getItemById<Preferences>(PREFERENCES_KEY);
}

export async function savePreferences(preferences: Preferences): Promise<void> {
    return storage.setItems({ [PREFERENCES_KEY]: preferences });
}


let currentPreferences: Preferences | null = null;
loadPreferences().then(prefs => {
    currentPreferences = prefs;
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
        return;
    }
    for (const [key, change] of Object.entries(changes)) {
        if (key === PREFERENCES_KEY) {
            if ('newValue' in change) {
                currentPreferences = change.newValue as Preferences;
            }
        }
    }
});
