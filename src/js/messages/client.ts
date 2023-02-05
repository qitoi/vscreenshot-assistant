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

import { Event, EventHandler } from '../libs/event';
import { MessageRequestValue, MessageResponseValue, MessageKey, MessageRequest, MessageResponse } from './type';
import { PortRequestValue, PortResponseValue, PortMessageKey, PortRequest, PortRequestValues, PortResponse, PortResponseValues, PortType } from './type';
import { KeepAliveClient } from './keep-alive/client';


export async function sendMessage<Key extends MessageKey>(key: Key, value: MessageRequestValue<Key>): Promise<MessageResponseValue<Key>> {
    return new Promise<MessageResponseValue<Key>>((resolve, reject) => {
        const request: MessageRequest<Key> = {
            key,
            value,
        };
        chrome.runtime.sendMessage(request, (response: MessageResponse<Key>) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            }
            else if ('error' in response) {
                reject(response.error);
            }
            else {
                resolve(response.value);
            }
        });
    });
}

export async function sendTabMessage<Key extends MessageKey>(tabId: number, key: Key, value: MessageRequestValue<Key>): Promise<MessageResponseValue<Key>> {
    return new Promise<MessageResponseValue<Key>>((resolve, reject) => {
        const request: MessageRequest<Key> = {
            key,
            value,
        };
        chrome.tabs.sendMessage(tabId, request, (response: MessageResponse<Key>) => {
            if (chrome.runtime.lastError) {
                console.log('send tab error', chrome.runtime.lastError);
                reject(chrome.runtime.lastError.message);
            }
            else if ('error' in response) {
                reject(response.error);
            }
            else {
                resolve(response.value);
            }
        });
    });
}


export function connectPort<Type extends PortType>(type: Type): PortClient<Type> {
    const id = (new Date()).getTime();
    const port = new PortWrapper(`${type}:${id}`);
    const client = new PortClient(type, port);

    // KeepAlive 以外のコネクションの場合は同時に KeepAlive 用のコネクションを開始して ServiceWorker の終了を防ぐ
    if (type !== 'keep-alive') {
        const keepAlive = new KeepAliveClient();
        client.onDisconnect.addListener(() => {
            keepAlive.disconnect();
        });
    }

    return client;
}

export function wrapPort<Type extends PortType>(type: Type, port: chrome.runtime.Port): PortClient<Type> {
    return new PortClient(type, new PortWrapper(port));
}


type PortMessageHandler<Type extends PortType, Key extends PortMessageKey<Type>> = (request: PortRequestValue<Type, Key>) => Promise<PortResponseValue<Type, Key>>;

export class PortClient<Type extends PortType> {
    private port: PortWrapper;
    private handlers: Record<string, (req: PortRequestValues<Type>) => Promise<PortResponseValues<Type>>> = {};

    public get name(): string {
        return this.port.name;
    }

    public get disconnected(): boolean {
        return this.port.disconnected;
    }

    public get onDisconnect(): PortWrapper['onDisconnect'] {
        return this.port.onDisconnect;
    }

    public constructor(type: Type, port: PortWrapper) {
        this.port = port;
        this.port.onMessage.addListener((request: PortRequest<Type, PortMessageKey<Type>>, sendResponse: (response: PortResponse<Type, PortMessageKey<Type>>) => void) => {
            if (request.key in this.handlers) {
                // メッセージの内容に対応するハンドラに処理を渡す
                this.handlers[request.key](request.value)
                    .then(value => {
                        // ハンドラの戻り値をレスポンスとして返す
                        sendResponse({ key: request.key, value });
                    })
                    .catch(e => {
                        // ポートが切断されている場合もここに来るが、送信できないのでなにもしない
                        if (!this.disconnected) {
                            if (e instanceof Error) {
                                sendResponse({ key: request.key, error: e.message });
                            }
                            else {
                                sendResponse({ key: request.key, error: 'unknown error' });
                            }
                        }
                    });
            }
        });
    }

    public sendMessage<Key extends PortMessageKey<Type>>(key: Key, value: PortRequestValue<Type, Key>): Promise<PortResponseValue<Type, Key>> {
        return new Promise<PortResponseValue<Type, Key>>((resolve, reject) => {
            const request: PortRequest<Type, Key> = {
                key,
                value,
            };
            this.port.sendMessage(request, (response: PortResponse<Type, Key>) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                }
                else if ('error' in response) {
                    reject(response.error);
                }
                else {
                    resolve(response.value);
                }
            });
        });
    }

    public handle<Key extends PortMessageKey<Type>>(key: Key, handler: PortMessageHandler<Type, Key>): PortClient<Type> {
        this.handlers[key] = handler;
        return this;
    }

    public disconnect(): void {
        this.port.disconnect();
    }
}


// chrome.runtime.Port の通信にレスポンスを導入するためのラッパー

type PortWrapperRequest = {
    reqId: number,
    value: any,
};
type PortWrapperResponse = {
    resId: number,
    value: any,
};

type MessageEventCallback = (request: any, sendResponse: (response: any) => void) => void;
type DisconnectEventCallback = () => void;

class PortWrapper {
    private port: chrome.runtime.Port;
    private seqId = 0;
    private responseReceivers: Record<number, (message: any) => void> = {};
    private _disconnected: boolean;

    private readonly onMessageEvent: Event<MessageEventCallback>;
    private readonly onDisconnectEvent: Event<DisconnectEventCallback>;

    get onMessage(): EventHandler<MessageEventCallback> {
        return this.onMessageEvent;
    }

    get onDisconnect(): EventHandler<DisconnectEventCallback> {
        return this.onDisconnectEvent;
    }

    get name(): string {
        return this.port.name;
    }

    get disconnected(): boolean {
        return this._disconnected;
    }

    constructor(port: string | chrome.runtime.Port) {
        if (typeof port === 'string') {
            this.port = chrome.runtime.connect({ name: port });
        }
        else {
            this.port = port;
        }

        this._disconnected = false;

        this.onMessageEvent = new Event<MessageEventCallback>();
        this.onDisconnectEvent = new Event<DisconnectEventCallback>();

        this.port.onMessage.addListener(this.handleMessage.bind(this));
        this.port.onDisconnect.addListener((this.handleDisconnect.bind(this)));
    }

    disconnect(): void {
        this._disconnected = true;
        this.onDisconnectEvent.clear();
        this.onMessageEvent.clear();
        this.port.disconnect();
    }

    sendMessage(value: any, callback?: (response: any) => void): void {
        this.seqId += 1;
        if (callback) {
            this.responseReceivers[this.seqId] = callback;
        }
        const request: PortWrapperRequest = {
            reqId: this.seqId,
            value,
        };
        this.port.postMessage(request);
    }

    private handleMessage(message: PortWrapperRequest | PortWrapperResponse): void {
        // receive request
        if ('reqId' in message) {
            this.onMessageEvent.dispatch([
                message.value,
                (value: any) => {
                    const response: PortWrapperResponse = {
                        resId: message.reqId,
                        value,
                    };
                    this.port.postMessage(response);
                },
            ]);
        }
        // receive response
        else {
            const resId = message.resId;
            this.responseReceivers[resId]?.(message.value);
            delete this.responseReceivers[resId];
        }
    }

    private handleDisconnect(): void {
        this._disconnected = true;
        this.onMessageEvent.clear();

        this.onDisconnectEvent.dispatch([]);
        this.onDisconnectEvent.clear();
    }
}
