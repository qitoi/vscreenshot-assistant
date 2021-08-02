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
import { Box, FormLabel, FormLabelProps, HStack, Spacer, Text, VStack } from '@chakra-ui/react';

type LabeledControlProps = FormLabelProps & {
    label: React.ReactElement,
    isVertical?: boolean,
};

const LabeledControl = ({ label, isVertical, children, ...rest }: LabeledControlProps) => {
    return (
        isVertical
            ? (
                <FormLabel w="100%" m={0}>
                    <VStack spacing={0}>
                        <Box w="100%" paddingTop="1em" paddingBottom="0.5em">{label}</Box>
                        <Box w="100%">
                            {children}
                        </Box>
                    </VStack>
                </FormLabel>
            ) : (
                <FormLabel w="100%" m={0} py="0.5em" {...rest}>
                    <HStack minH={10}>
                        <Text>{label}</Text>
                        <Spacer />
                        {children}
                    </HStack>
                </FormLabel>
            )
    );
};

export default LabeledControl;
