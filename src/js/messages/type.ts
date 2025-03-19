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


export interface MessageTypes {
}


// メッセージのキーの一覧
export type MessageKey = keyof MessageTypes;

// メッセージのリクエスト・レスポンスの型一覧
export type MessageRequestValues = MessageTypes[keyof MessageTypes][0];
export type MessageResponseValues = MessageTypes[keyof MessageTypes][1];

// キーに関連付けられているリクエスト・レスポンスの型
export type MessageRequestValue<Key extends MessageKey> = MessageTypes[Key][0];
export type MessageResponseValue<Key extends MessageKey> = MessageTypes[Key][1];

// クライアント・サーバ間の通信用オブジェクト
export type MessageRequest<Key extends MessageKey> = {
    key: Key;
    value: MessageRequestValue<Key>;
};
export type MessageResponse<Key extends MessageKey> = {
    key: Key;
    value: MessageResponseValues;
} | {
    key: Key;
    error: string;
};


export interface PortMessageTypes {
}


// ポートタイプの一覧
export type PortType = keyof PortMessageTypes;
// ポートタイプに関連付けられているメッセージのキー
export type PortMessageKey<Type extends PortType> = Type extends PortType ? keyof PortMessageTypes[Type] : never;

type Index<T, N extends number> = T extends unknown[] ? T[N] : never;
type PortMessageValue<Type extends PortType, Key extends PortMessageKey<Type>, N extends number> =
    Type extends PortType
        ? Key extends PortMessageKey<Type>
            ? Index<PortMessageTypes[Type][Key], N>
            : never
        : never
    ;

// ポートタイプに関連付けられているリクエスト・レスポンスの型一覧
export type PortRequestValues<Type extends PortType> = PortMessageValue<Type, PortMessageKey<Type>, 0>;
export type PortResponseValues<Type extends PortType> = PortMessageValue<Type, PortMessageKey<Type>, 1>;

// ポートタイプ、キーに関連付けられているリクエスト・レスポンスの型
export type PortRequestValue<Type extends PortType, Key extends PortMessageKey<Type>> = PortMessageValue<Type, Key, 0>;
export type PortResponseValue<Type extends PortType, Key extends PortMessageKey<Type>> = PortMessageValue<Type, Key, 1>;

// ポート間の通信用オブジェクト
export type PortRequest<Type extends PortType, Key extends PortMessageKey<Type>> = {
    key: PortMessageKey<Type>;
    value: PortRequestValue<Type, Key>;
};
export type PortResponse<Type extends PortType, Key extends PortMessageKey<Type>> = {
    key: PortMessageKey<Type>;
    value: PortResponseValue<Type, Key>;
} | {
    key: PortMessageKey<Type>;
    error: string;
};
