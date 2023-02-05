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


type Callback = (...args: any[]) => any;

export interface EventHandler<F extends Callback> {
    addListener: (callback: F) => void;
    removeListener: (callback: F) => void;
    clear: () => void;
}

export interface EventDispatcher<F extends Callback> {
    dispatch(args: Parameters<F>): void;
}

export class Event<F extends Callback> implements EventHandler<F>, EventDispatcher<F> {
    callbacks: (F)[] = [];

    addListener(callback: F): void {
        this.callbacks.push(callback);
    }

    removeListener(callback: F): void {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    clear(): void {
        this.callbacks = [];
    }

    dispatch(args: Parameters<F>): void {
        for (const cb of this.callbacks) {
            cb(...args);
        }
    }
}
