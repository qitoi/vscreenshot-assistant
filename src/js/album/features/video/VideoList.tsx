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
import { Box, Center, VStack } from '@chakra-ui/react';

import { getVideoKey, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import { useDispatch, useSelector } from '../../store';
import { setActiveVideo } from '../activeVideo/activeVideoSlice';
import { selectVideoList, setVideoList } from './videoSlice';
import VideoThumbnail from './VideoThumbnail';
import VideoSortOrderSelect from './VideoSortOrderSelect';

const VideoList: React.FC = () => {
    const dispatch = useDispatch();
    const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
    const videos = useSelector(selectVideoList);

    React.useEffect(() => {
        storage.getVideoInfoList()
            .then(videos => {
                setIsLoaded(true);
                dispatch(setVideoList(videos));
            });
    }, [dispatch]);

    const handleSelected = React.useCallback((video: VideoInfo) => {
        dispatch(setActiveVideo(video));
    }, [dispatch]);

    return (
        <VStack h="100%" spacing={0} m={0} p={0}>
            <Center w="100%" h="5em" p="1em" bg="gray.500" color="white" fontSize="lg" flexShrink={0}>
                {isLoaded && (
                    <VideoSortOrderSelect />
                )}
            </Center>
            {isLoaded && (
                <Box w="100%" h="100%" overflowY="scroll">
                    <VStack py="1em">
                        {videos.map((v) =>
                            <VideoThumbnail key={getVideoKey(v)} info={v} onSelected={handleSelected} />
                        )}
                    </VStack>
                </Box>
            )}
        </VStack>
    );
};

export default React.memo(VideoList);
