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
import { getLocalizedText, MessageId } from '../libs/localize';

type LocalizedTextProps = {
    messageId: MessageId;
    substitutions?: string[];
};

export function useLocalizedText(messageId: MessageId, substitutions?: string[]): string {
    return React.useMemo(() => getLocalizedText(messageId, substitutions), [messageId, ...(substitutions ?? [])]);
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({ messageId, substitutions }: LocalizedTextProps) => {
    const message = useLocalizedText(messageId, substitutions);
    return (
        <>{message}</>
    );
};
