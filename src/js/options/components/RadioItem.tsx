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
import { Box, BoxProps, HStack, Radio } from '@chakra-ui/react';

import { LocalizedText, MessageId } from '../../lib/components/LocalizedText';

type RadioItemProps<T> = BoxProps & {
    value: T,
    messageId: MessageId,
};

const RadioItem = <T extends string | number>({ value, messageId, children }: RadioItemProps<T>): React.ReactElement => {
    return (
        <HStack w="100%">
            <Radio value={value} py="1em" w="100%"><LocalizedText messageId={messageId} /></Radio>
            <Box flexShrink={0}>
                {children}
            </Box>
        </HStack>
    );
};

export default RadioItem;
