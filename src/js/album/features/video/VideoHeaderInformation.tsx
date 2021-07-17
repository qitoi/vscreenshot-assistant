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
import { Box, HStack, Link } from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';

import platforms from '../../../lib/platforms';
import { useSelector } from '../../store';
import { selectActiveVideo } from '../activeVideo/activeVideoSlice';

export function VideoHeaderInformation() {
    const video = useSelector(selectActiveVideo);

    if (video === null) {
        return null;
    }

    return (
        <Box w="100%" overflow="hidden">
            <HStack w="100%" spacing={1}>
                {video.private && <LockIcon boxSize="1em" color="yellow.400" />}
                <Link href={platforms.getVideoURL(video.platform, video.videoId)} isExternal={true}
                      whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                    {video.title} / {video.author}
                </Link>
            </HStack>
            <Box>{(new Date(video.date)).toDateString()}</Box>
        </Box>
    );
}
