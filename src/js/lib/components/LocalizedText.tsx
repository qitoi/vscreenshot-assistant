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

import * as React from 'react';

import * as message from '../../../_locales/ja/messages.json';

export type MessageId = keyof typeof message;

type LocalizedTextProps = {
    messageId: MessageId,
    substitutions?: string[],
};

export function getLocalizedText(messageId: MessageId, substitutions?: string[]): string {
    return chrome.i18n.getMessage(messageId, substitutions);
}

export function useLocalizedText(messageId: MessageId, substitutions?: string[]): string {
    return React.useMemo(() => getLocalizedText(messageId, substitutions), [messageId, ...(substitutions ?? [])]);
}

export function LocalizedText({ messageId, substitutions }: LocalizedTextProps) {
    const message = useLocalizedText(messageId, substitutions);
    return (
        <>{message}</>
    );
}
