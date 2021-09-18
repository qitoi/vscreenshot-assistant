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

const removers: (() => void)[] = [];

window.addEventListener('beforeunload', () => {
    for (const remover of removers) {
        remover();
    }
}, { once: true });

export function listenAuto<T extends chrome.events.Event<any>>(event: T, callback: Parameters<T['addListener']>[0]): void {
    event.addListener(callback);
    removers.push(() => {
        event.removeListener(callback);
    });
}

export function listenOnce<T extends chrome.events.Event<any>>(event: T, callback: Parameters<T['addListener']>[0]): void {
    event.addListener((...args: Parameters<Parameters<T['addListener']>[0]>) => {
        event.removeListener(callback);
        const idx = removers.indexOf(callback);
        if (idx !== -1) {
            removers.splice(idx, 1);
        }
        callback(...args);
    });
    removers.push(() => {
        event.removeListener(callback);
    });
}
