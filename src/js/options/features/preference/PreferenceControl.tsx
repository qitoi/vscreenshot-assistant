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
import { Box, FormControl, FormControlProps, FormLabel, HStack, Spacer, Text } from '@chakra-ui/react';
import { FieldPath } from 'react-hook-form';

type PreferenceControlProps<T> = FormControlProps & {
    name?: FieldPath<T>,
    label?: string,
    isFitted?: boolean,
    isEnabledHover?: boolean,
};

export function PreferenceControl<T>({ name, label, isFitted, isEnabledHover, children, ...rest }: PreferenceControlProps<T>) {
    const fit = (isFitted === true) ? { width: 'fit-content' } : {};
    const padding = (isFitted === true) ? {} : { px: '1em', py: '0.5em' };
    const spacer = (isFitted === true) ? null : <Spacer />;
    const hover = (isEnabledHover === true) ? { transition: 'background ease-out 200ms', _hover: { background: 'blackAlpha.50' } } : {};
    return (
        <FormControl fontSize="md" {...fit} {...rest}>
            <HStack>
                {(name && label)
                    ? (
                        <FormLabel htmlFor={name} w="100%" m={0} {...padding} {...hover}>
                            <HStack minH={10}>
                                <Text>{label}</Text>
                                {spacer}
                                {children}
                            </HStack>
                        </FormLabel>
                    )
                    : <Box w="100%" {...padding}><Box minH={10}>{children}</Box></Box>
                }
            </HStack>
        </FormControl>
    );
}
