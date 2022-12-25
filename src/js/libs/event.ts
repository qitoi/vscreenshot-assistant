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

export interface EventHandler<T> {
    addListener: (callback: (value: T) => void) => void;
    removeListener: (callback: (value: T) => void) => void;
    clear: () => void;
}

export interface EventDispatcher<T> {
    dispatch(value: T): void;
}

export class Event<T> implements EventHandler<T>, EventDispatcher<T> {
    callbacks: ((value: T) => void)[] = [];

    addListener(callback: (value: T) => void): void {
        this.callbacks.push(callback);
    }

    removeListener(callback: (value: T) => void): void {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    clear(): void {
        this.callbacks = [];
    }

    dispatch(value: T): void {
        for (const cb of this.callbacks) {
            cb(value);
        }
    }
}
