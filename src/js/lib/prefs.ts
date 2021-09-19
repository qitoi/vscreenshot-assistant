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
import * as hotkeys from './hotkeys';
import { Event, EventHandler } from './event';
import { listenAuto } from './event-listen';


const PREFERENCES_KEY = 'preferences';


// アイコンクリック時の挙動設定
export const ClickIconActions = {
    OpenAlbum: 0,
    CaptureScreenshot: 1,
} as const;
export type ClickIconAction = typeof ClickIconActions[keyof typeof ClickIconActions];
const isClickIconAction = (value: any): value is ClickIconAction => Object.values(ClickIconActions).includes(value);


// スクリーンショットのファイルフォーマット設定
const FileTypes = ['image/jpeg', 'image/png'] as const;
export type FileType = typeof FileTypes[number];
const isFileType = (value: any): value is FileType => FileTypes.some(t => t === value);


export const ToastPositions = {
    LeftBottom: 0,
    RightBottom: 1,
    LeftTop: 2,
    RightTop: 3,
} as const;
export type ToastPosition = typeof ToastPositions[keyof typeof ToastPositions];
const isToastPosition = (type: any): type is ToastPosition => Object.values(ToastPositions).includes(type);

export type Preferences = {
    general: {
        iconAction: ClickIconAction,
        notify: boolean,
        notifyPosition: ToastPosition,
        notifyDuration: number,
    },
    screenshot: {
        hotkey: hotkeys.KeyConfig,
        enabledContinuous: boolean,
        continuousHotkey: hotkeys.KeyConfig,
        continuousInterval: number,
        fileType: FileType,
        quality: number,
    },
    thumbnail: {
        width: number,
        height: number,
    },
    tweet: {
        enabled: boolean,
        hashtag: boolean,
        url: boolean,
        title: boolean,
        author: boolean,
    },
    animation: {
        enabled: boolean,
        hotkey: hotkeys.KeyConfig,
        width: number,
        height: number,
        interval: number,
    },
};

export const DefaultPreferences: Preferences = {
    general: {
        iconAction: ClickIconActions.OpenAlbum,
        notify: true,
        notifyPosition: ToastPositions.LeftBottom,
        notifyDuration: 1000,
    },
    screenshot: {
        hotkey: hotkeys.getKeyConfig('S', { shift: true }),
        enabledContinuous: false,
        continuousHotkey: hotkeys.getKeyConfig('D', { shift: true }),
        continuousInterval: 500,
        fileType: 'image/jpeg',
        quality: 94,
    },
    animation: {
        enabled: true,
        hotkey: hotkeys.getKeyConfig('V', { shift: true }),
        width: 640,
        height: 640,
        interval: 50,
    },
    thumbnail: {
        width: 320,
        height: 180,
    },
    tweet: {
        enabled: true,
        url: true,
        title: true,
        author: false,
        hashtag: true,
    },
};

function completePreferences(prefs: Preferences): Preferences {
    const completeClickIconAction = (value?: any): ClickIconAction => isClickIconAction(value) ? value : DefaultPreferences.general.iconAction;
    const completeFileType = (value?: any): FileType => isFileType(value) ? value : DefaultPreferences.screenshot.fileType;
    const completeToastPosition = (value?: any): ToastPosition => isToastPosition(value) ? value : DefaultPreferences.general.notifyPosition;
    const completeKeyConfig = (value: any, defaultValue: hotkeys.KeyConfig) => hotkeys.isKeyConfig(value) ? value : defaultValue;
    return {
        general: {
            iconAction: completeClickIconAction(prefs?.general?.iconAction),
            notify: Boolean(prefs?.general?.notify ?? DefaultPreferences.general.notify),
            notifyPosition: completeToastPosition(prefs?.general?.notifyPosition),
            notifyDuration: Math.min(Math.max(Math.round(+(prefs?.general?.notifyDuration ?? DefaultPreferences.general.notifyDuration)), 100), 60000),
        },
        screenshot: {
            hotkey: completeKeyConfig(prefs?.screenshot?.hotkey, DefaultPreferences.screenshot.hotkey),
            enabledContinuous: Boolean(prefs?.screenshot?.enabledContinuous ?? DefaultPreferences.screenshot.enabledContinuous),
            continuousHotkey: completeKeyConfig(prefs?.screenshot?.continuousHotkey, DefaultPreferences.screenshot.continuousHotkey),
            continuousInterval: Math.min(Math.max(Math.round(+(prefs?.screenshot?.continuousInterval ?? DefaultPreferences.screenshot.continuousInterval)), 1), 9999),
            fileType: completeFileType(prefs?.screenshot?.fileType),
            quality: Math.min(Math.max(Math.round(+(prefs?.screenshot?.quality ?? DefaultPreferences.screenshot.quality)), 0), 100),
        },
        thumbnail: {
            width: Math.min(Math.max(Math.round(+(prefs?.thumbnail?.width ?? DefaultPreferences.thumbnail.width)), 1), 9999),
            height: Math.min(Math.max(Math.round(+(prefs?.thumbnail?.height ?? DefaultPreferences.thumbnail.height)), 1), 9999),
        },
        tweet: {
            enabled: Boolean(prefs?.tweet?.enabled ?? DefaultPreferences.tweet.enabled),
            url: Boolean(prefs?.tweet?.url ?? DefaultPreferences.tweet.url),
            title: Boolean(prefs?.tweet?.title ?? DefaultPreferences.tweet.title),
            author: Boolean(prefs?.tweet?.author ?? DefaultPreferences.tweet.author),
            hashtag: Boolean(prefs?.tweet?.hashtag ?? DefaultPreferences.tweet.hashtag),
        },
        animation: {
            enabled: Boolean(prefs?.animation?.enabled ?? DefaultPreferences.animation.enabled),
            hotkey: completeKeyConfig(prefs?.animation?.hotkey, DefaultPreferences.animation.hotkey),
            width: Math.min(Math.max(Math.round(+(prefs?.animation?.width ?? DefaultPreferences.animation.width)), 1), 9999),
            height: Math.min(Math.max(Math.round(+(prefs?.animation?.height ?? DefaultPreferences.animation.height)), 1), 9999),
            interval: Math.min(Math.max(Math.round(+(prefs?.animation?.interval ?? DefaultPreferences.animation.interval)), 1), 9999),
        },
    };
}


export async function loadPreferences(): Promise<Preferences> {
    if (currentPreferences !== null) {
        return Promise.resolve(currentPreferences);
    }
    return storage.getItemById<Preferences>(PREFERENCES_KEY, DefaultPreferences).then(prefs => completePreferences(prefs));
}

export async function savePreferences(prefs: Preferences): Promise<void> {
    return storage.setItems({ [PREFERENCES_KEY]: { ...completePreferences(prefs), t: Date.now() } });
}

export async function resetPreferences(): Promise<void> {
    return savePreferences(DefaultPreferences);
}


type PreferencesEventHandler = EventHandler<Preferences>;

let onChanged: PreferencesEventHandler | null = null;

export function watch(): PreferencesEventHandler {
    if (onChanged !== null) {
        return onChanged;
    }

    const prefsEvent = new Event<Preferences>();

    loadPreferences().then(prefs => {
        currentPreferences = completePreferences(prefs);
    });

    listenAuto(chrome.storage.onChanged, (changes, area) => {
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
