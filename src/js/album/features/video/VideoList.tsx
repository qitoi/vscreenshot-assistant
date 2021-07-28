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
import { Center, VStack } from '@chakra-ui/react';

import { getVideoKey, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import { useDispatch, useSelector } from '../../store';
import { setActiveVideo } from '../activeVideo/activeVideoSlice';
import { selectVideoList, setVideoList } from './videoSlice';
import { VideoThumbnail } from './VideoThumbnail';
import { VideoSortOrderSelect } from './VideoSortOrderSelect';

const VideoList = React.memo(() => {
    const dispatch = useDispatch();
    const videos = useSelector(selectVideoList);

    React.useEffect(() => {
        storage.getVideoInfoList()
            .then(videos => {
                dispatch(setVideoList(videos));
            });
    }, []);

    const handleSelected = React.useCallback((video: VideoInfo) => {
        dispatch(setActiveVideo(video));
    }, []);

    return (
        <>
            <Center p="1em" bg="teal.600" color="white" fontSize="lg" h="5em">
                <VideoSortOrderSelect />
            </Center>
            <VStack my={5}>
                {videos.map((v) =>
                    <VideoThumbnail key={getVideoKey(v)} info={v} onSelected={handleSelected} />
                )}
            </VStack>
        </>
    );
});

export default VideoList;
