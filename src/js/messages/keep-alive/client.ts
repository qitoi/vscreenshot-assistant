/*
 *  Copyright 2023 qitoi
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


// WORKAROUND: ServiceWorkerが300秒で終了してしまうため、250秒ごとにコネクションを張り直して終了しないようにする
// https://bugs.chromium.org/p/chromium/issues/detail?id=1152255

import { connectPort, PortClient } from '../client';


const KEEP_ALIVE_INTERVAL = 250 * 1000;


export class KeepAliveClient {
    private port: PortClient<'keep-alive'> | null = null;
    private readonly timerId: number;

    public constructor(interval: number = KEEP_ALIVE_INTERVAL) {
        this.connectPort();
        this.timerId = self.setInterval(() => {
            this.connectPort();
        }, interval);
    }

    public disconnect(): void {
        if (this.port !== null) {
            this.port.disconnect();
            this.port = null;
        }
        self.clearInterval(this.timerId);
    }

    private connectPort(): void {
        if (this.port !== null) {
            this.port.disconnect();
        }
        this.port = connectPort('keep-alive');
    }
}
