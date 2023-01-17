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

import { Event, EventDispatcher, EventHandler } from './event';
import { MessageRequest, MessageResponse, ResponseType } from './messages';
import { listenAuto } from './event-listen';


type PortRequestMessage = {
    reqId: number,
    value: any,
};
type PortResponseMessage = {
    resId: number,
    value: any,
};

type PortMessageParam<Req extends MessageRequest> = Req extends any ? Req & {
    sendResponse: (message: ResponseType<Req>) => void,
} : never;

// WORKAROUND: ServiceWorkerが300秒で終了してしまうため、250秒ごとにコネクションを張り直して終了しないようにする
// https://bugs.chromium.org/p/chromium/issues/detail?id=1152255
const KEEP_ALIVE_INTERVAL = 250 * 1000;

export class Port {
    private port: chrome.runtime.Port;
    private seqId = 0;
    private responseReceivers: Record<number, (message: unknown) => void> = {};
    private keepAlive: chrome.runtime.Port | null = null;
    private keepAliveTimer: number | null = null;

    public readonly name: string;
    private _disconnected: boolean;

    get disconnected(): boolean {
        return this._disconnected;
    }

    readonly onMessage: EventHandler<PortMessageParam<MessageRequest>>;
    private readonly onMessageDispatcher: EventDispatcher<PortMessageParam<MessageRequest>>;
    public readonly onDisconnect: EventHandler<void>;
    private readonly onDisconnectDispatcher: EventDispatcher<void>;

    constructor(port: string | chrome.runtime.Port) {
        if (typeof port === 'string') {
            this.port = chrome.runtime.connect({ name: port });
            this.startKeepAlive();
        }
        else {
            this.port = port;
        }

        this.name = this.port.name;
        this._disconnected = false;

        this.port.onMessage.addListener(value => {
            const message = value as PortRequestMessage | PortResponseMessage;
            // receive response
            if ('resId' in message) {
                const seqId = message.resId;
                if (seqId in this.responseReceivers) {
                    this.responseReceivers[seqId](message.value);
                    delete this.responseReceivers[seqId];
                }
            }
            // receive request
            else if ('reqId' in message) {
                const value: PortMessageParam<MessageRequest> = {
                    ...message.value,
                    sendResponse: (msg: ResponseType<MessageRequest>) => {
                        if (!this.disconnected) {
                            this.sendResponse(message.reqId, msg);
                        }
                    },
                };
                this.onMessageDispatcher.dispatch(value);
            }
        });

        this.port.onDisconnect.addListener(() => {
            this._disconnected = true;
            this.onMessage.clear();

            this.onDisconnectDispatcher.dispatch();
            this.onDisconnect.clear();

            this.stopKeepAlive();
        });

        const evt = new Event<PortMessageParam<MessageRequest>>();
        this.onMessageDispatcher = evt;
        this.onMessage = evt;

        const disconnect = new Event<void>();
        this.onDisconnectDispatcher = disconnect;
        this.onDisconnect = disconnect;
    }

    disconnect(): void {
        this._disconnected = true;
        this.onDisconnect.clear();
        this.onMessage.clear();
        this.port.disconnect();
        this.stopKeepAlive();
    }

    sendMessage<T extends MessageRequest>(message: T, callback?: (response: ResponseType<T>) => void): void {
        this.seqId += 1;
        const param: PortRequestMessage = {
            reqId: this.seqId,
            value: message,
        };
        this.port.postMessage(param);
        if (callback) {
            this.responseReceivers[this.seqId] = callback as (u: unknown) => void;
        }
    }

    private sendResponse<T extends MessageResponse>(seqId: number, message: T): void {
        const param: PortResponseMessage = {
            resId: seqId,
            value: message,
        };
        this.port.postMessage(param);
    }

    private startKeepAlive(): void {
        const keepAlive = () => {
            this.stopKeepAlive();
            const id = Date.now();
            this.keepAlive = chrome.runtime.connect({ name: `keep-alive:${id}` });
            this.keepAliveTimer = self.setTimeout(keepAlive, KEEP_ALIVE_INTERVAL);
        };
        keepAlive();
    }

    private stopKeepAlive(): void {
        if (this.keepAliveTimer !== null) {
            clearTimeout(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
        if (this.keepAlive !== null) {
            this.keepAlive.disconnect();
            this.keepAlive = null;
        }
    }
}

export function listenPort(): EventHandler<Port> {
    const evt = new Event<Port>();

    listenAuto(chrome.runtime.onConnect, p => {
        evt.dispatch(new Port(p));
    });

    return evt;
}
