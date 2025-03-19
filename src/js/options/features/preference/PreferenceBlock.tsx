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
import { Box, Heading, StackProps, VStack } from '@chakra-ui/react';

import { MessageId } from '../../../libs/localize';
import { LocalizedText } from '../../../components/LocalizedText';

type PreferenceBlockProps = StackProps & {
    messageId: MessageId;
};

const PreferenceBlock: React.FC<PreferenceBlockProps> = ({ messageId, children, ...rest }: PreferenceBlockProps) => {
    return (
        <Box w="100%">
            <Box borderLeft="2px solid" borderColor="gray.300" paddingLeft="2em" py="0.5em">
                <Heading as="h2" fontSize="2xl" py="0.5em"><LocalizedText messageId={messageId} /></Heading>
                <VStack w="100%" rounded="md" {...rest}>
                    {children}
                </VStack>
            </Box>
        </Box>
    );
};

export default PreferenceBlock;
