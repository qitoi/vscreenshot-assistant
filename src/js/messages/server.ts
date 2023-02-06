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

import { listenAuto } from '../libs/event-listen';
import { MessageRequestValue, MessageResponseValue, MessageKey, MessageRequest, MessageRequestValues, MessageResponse, MessageResponseValues } from './type';
import { PortRequestValue, PortResponseValue, PortMessageKey, PortRequestValues, PortResponseValues, PortType } from './type';
import { wrapPort, PortClient } from './client';


type MessageHandler<Key extends MessageKey> = (request: MessageRequestValue<Key>) => Promise<MessageResponseValue<Key>>;

export interface MessageServerBuilder {
    handle<Key extends MessageKey>(type: Key, handler: MessageHandler<Key>): MessageServerBuilder;
}

export class MessageServer implements MessageServerBuilder {
    private handlers: Record<string, (req: MessageRequestValues) => Promise<MessageResponseValues>> = {};

    public handle<Key extends MessageKey>(type: Key, handler: MessageHandler<Key>): MessageServer {
        this.handlers[type] = handler;
        return this;
    }

    public bind(setup: (server: MessageServerBuilder) => void): MessageServer {
        setup(this);
        return this;
    }

    public listen(): void {
        listenAuto(chrome.runtime.onMessage, (request: MessageRequest<MessageKey>, sender, sendResponse: (response: MessageResponse<MessageKey>) => void) => {
            if (request.key in this.handlers) {
                this.handlers[request.key](request.value)
                    .then(value => {
                        sendResponse({ key: request.key, value });
                    })
                    .catch(e => {
                        if (e instanceof Error) {
                            sendResponse({ key: request.key, error: e.message });
                        }
                        else {
                            sendResponse({ key: request.key, error: 'unknown error' });
                        }
                    });
                return true;
            }
            sendResponse({ key: request.key, error: 'command not found' });
        });
    }
}


export interface PortServerBuilder {
    handle(handler: PortHandler<any, any>): PortServerBuilder;
}

export class PortServer implements PortServerBuilder {
    private handlers = new Map<PortType, PortHandler<PortType, any>>();

    public handle(handler: PortHandler<PortType, any>): PortServer {
        this.handlers.set(handler.type, handler);
        return this;
    }

    public bind(setup: (server: PortServerBuilder) => void): PortServer {
        setup(this);
        return this;
    }

    public listen(): void {
        listenAuto(chrome.runtime.onConnect, chromePort => {
            const portType = chromePort.name.split(':')[0] as PortType;
            const handler = this.handlers.get(portType);

            if (!handler) {
                chromePort.disconnect();
                return;
            }

            const port = wrapPort(portType, chromePort);
            const context = handler.connect(port);

            handler.message(port, context);

            port.onDisconnect.addListener(() => {
                handler.disconnect(context);
            });
        });
    }
}


type PortConnectFunc<Type extends PortType, Context> = (port: PortClient<Type>) => Context;
type PortDisconnectFunc<Context> = (context: Context) => void;
type PortMessageFunc<Type extends PortType, Key extends PortMessageKey<Type>, Context> =
    (request: PortRequestValue<Type, Key>, context: Context, port: PortClient<Type>) => Promise<PortResponseValue<Type, Key>>;

export class PortHandler<Type extends PortType, Context = undefined> {
    private readonly connectHandler: PortConnectFunc<Type, Context>;
    private disconnectHandler?: PortDisconnectFunc<Context>;
    private handlers = new Map<PortMessageKey<Type>, (request: PortRequestValues<Type>, context: Context, port: PortClient<Type>) => Promise<PortResponseValues<Type>>>();

    public readonly type: Type;

    public constructor(type: Type, connect: PortConnectFunc<Type, Context>) {
        this.type = type;
        this.connectHandler = connect;
    }

    public connect(port: PortClient<Type>): Context {
        return this.connectHandler(port);
    }

    public disconnect(context: Context): void {
        this.disconnectHandler?.(context);
    }

    public message(port: PortClient<Type>, context: Context): void {
        for (const [key, handler] of this.handlers.entries()) {
            port.handle(key, request => {
                return handler(request, context, port);
            });
        }
    }

    public addMessageHandler<Key extends PortMessageKey<Type>>(key: Key, handler: PortMessageFunc<Type, Key, Context>): PortHandler<Type, Context> {
        this.handlers.set(key, handler);
        return this;
    }

    public addDisconnectHandler(handler: PortDisconnectFunc<Context>): PortHandler<Type, Context> {
        this.disconnectHandler = handler;
        return this;
    }
}
