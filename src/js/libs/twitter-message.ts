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

const TWITTER_ORIGIN = 'https://twitter.com';
const X_ORIGIN = 'https://x.com';
const MESSAGE_TAG = 'vscreenshot-assistant';

type Message = {
    tag: 'vscreenshot-assistant',
    files: File[],
};

function isMessage(value: any): value is Message {
    if (typeof value === 'object' && value !== null) {
        if (value.tag === MESSAGE_TAG && Array.isArray(value.files)) {
            return (value.files as any[]).every(f => f instanceof File);
        }
    }
    return false;
}

function FileMessage(files: File[]): Message {
    return {
        tag: 'vscreenshot-assistant',
        files,
    };
}

export function sendFiles(files: File[]): void {
    if (window.location.origin === TWITTER_ORIGIN) {
        window.postMessage(FileMessage(files), TWITTER_ORIGIN);
    }
    else {
        window.postMessage(FileMessage(files), X_ORIGIN);
    }
}

export function receiveFiles(message: MessageEvent): File[] | null {
    if (message.origin !== TWITTER_ORIGIN && message.origin !== X_ORIGIN) {
        return null;
    }

    if (!isMessage(message.data)) {
        return null;
    }

    return message.data.files;
}
