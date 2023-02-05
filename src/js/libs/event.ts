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

export interface EventHandler<T, U extends any[] = []> {
    addListener: (callback: (value: T, ...opt: U) => void) => void;
    removeListener: (callback: (value: T, ...opt: U) => void) => void;
    clear: () => void;
}

export interface EventDispatcher<T, U extends any[] = []> {
    dispatch(value: T, ...opt: U): void;
}

export class Event<T, U extends any[] = []> implements EventHandler<T, U>, EventDispatcher<T, U> {
    callbacks: ((value: T, ...opt: U) => void)[] = [];

    addListener(callback: (value: T, ...opt: U) => void): void {
        this.callbacks.push(callback);
    }

    removeListener(callback: (value: T, ...opt: U) => void): void {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    clear(): void {
        this.callbacks = [];
    }

    dispatch(value: T, ...opt: U): void {
        for (const cb of this.callbacks) {
            cb(value, ...opt);
        }
    }
}
