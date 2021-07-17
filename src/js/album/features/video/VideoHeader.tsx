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
import { Box, HStack, Spacer } from '@chakra-ui/react';

import { ScreenshotSortOrderSelect } from '../screenshot/ScreenshotSortOrderSelect';
import { VideoHeaderMenu } from './VideoHeaderMenu';
import { VideoHeaderInformation } from './VideoHeaderInformation';

export default function VideoHeader() {
    return (
        <Box h="5em" p="1em" fontSize="lg" lineHeight="1.5em" bg="teal.500" color="white">
            <HStack h="3em">
                <VideoHeaderInformation />
                <Spacer />
                <Box flexShrink={0}>
                    <ScreenshotSortOrderSelect />
                </Box>
                <Box fontSize="md" color="black">
                    <VideoHeaderMenu />
                </Box>
            </HStack>
        </Box>
    );
}
