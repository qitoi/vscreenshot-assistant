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
import { Box, BoxProps, FormLabel, HStack, Radio } from '@chakra-ui/react';

type RadioItemProps<T> = BoxProps & {
    value: T,
    label: string,
};

export function RadioItem<T extends string>({ value, label, children }: RadioItemProps<T>) {
    return (
        <HStack w="100%" px="1em" py="0.5em">
            <FormLabel w="100%" m={0}>
                <Radio value={value} w="100%" minH={10}>{label}</Radio>
            </FormLabel>
            <Box flexShrink={0}>
                {children}
            </Box>
        </HStack>
    );
}
