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
import { Box, chakra, Heading, StackProps, VStack } from '@chakra-ui/react';

function Border() {
    return (
        <chakra.hr w="100%" m={0} p={0} borderBottomWidth={0} borderColor="gray.200" />
    );
}

type PreferenceBlockProps = StackProps & {
    name: string,
};

const PreferenceBlock: React.FC<PreferenceBlockProps> = ({ name, children, ...rest }: PreferenceBlockProps) => {
    return (
        <Box w="100%" paddingBottom="1em">
            <Heading as="h2" fontSize="lg" py="1em">{name}</Heading>
            <VStack w="100%" border="1px" borderColor="gray.200" rounded="md" divider={<Border />} {...rest}>
                {children}
            </VStack>
        </Box>
    );
};

export default PreferenceBlock;
