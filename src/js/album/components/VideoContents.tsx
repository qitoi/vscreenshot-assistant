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
import { Box, Flex } from '@chakra-ui/react';

import { getVideoKey, VideoInfo } from '../../lib/types';
import { loadScreenshotSortOrder, saveScreenshotSortOrder, ScreenshotSortOrder } from '../lib/ScreenshotSort';
import VideoHeader from './VideoHeader';
import ScreenshotList from './ScreenshotList';

type VideoContentsProps = {
    video: VideoInfo,
}

export default function VideoContents({ video }: VideoContentsProps) {
    const [sortOrder, setSortOrder] = React.useState<ScreenshotSortOrder>(loadScreenshotSortOrder());

    const handleChangeSortOrder = order => {
        saveScreenshotSortOrder(order);
        setSortOrder(order);
    };

    return (
        <Flex direction="column" w="100%" h="calc(100vh)" minW={0} overflowX="hidden">
            {video && (
                <VideoHeader
                    key={getVideoKey(video)}
                    video={video}
                    order={sortOrder}
                    onChangeSortOrder={handleChangeSortOrder} />
            )}
            <Box flexGrow={1} w="100%" overflowY="scroll">
                {video && (
                    <ScreenshotList
                        key={`${video.platform}-${video.videoId}`}
                        video={video}
                        sortOrder={sortOrder} />
                )}
            </Box>
        </Flex>
    );
}

