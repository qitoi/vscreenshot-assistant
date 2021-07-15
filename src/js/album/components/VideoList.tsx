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
import { Box, Center, Fade, Image, Select, useBoolean, VStack } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';

import { getVideoKey, VideoInfo } from '../../lib/types';
import * as storage from '../../lib/background/storage';
import { VideoSortOrder, VideoSortOrders } from '../lib/VideoSort';

import { useDispatch, useSelector } from '../stores/store';
import { selectVideoList, selectVideoSortOrder, setSortOrder, setVideoList } from '../stores/videoSlice';
import { setActiveVideo } from '../stores/activeVideoAction';

const VideoList = React.memo(() => {
    const dispatch = useDispatch();
    const videos = useSelector(selectVideoList);
    const order = useSelector(selectVideoSortOrder);

    React.useEffect(() => {
        storage.getVideoInfoList()
            .then(videos => {
                dispatch(setVideoList(videos));
            });
    }, []);

    const handleChangeSortOrder = e => {
        const order: VideoSortOrder = e.target.value;
        dispatch(setSortOrder(order));
    };

    const handleSelected = React.useCallback((video: VideoInfo) => {
        dispatch(setActiveVideo(video));
    }, []);

    return (
        <>
            <Center p="1em" bg="teal.600" color="white" fontSize="lg" h="5em">
                <Select onChange={handleChangeSortOrder}>
                    {Object.entries(VideoSortOrders).map(([val, label]) => (
                        <option style={{ color: 'black' }} selected={+val === order} value={val}>
                            {label}
                        </option>
                    ))}
                </Select>
            </Center>
            <VStack my={5}>
                {videos.map((v) =>
                    <VideoThumbnail key={getVideoKey(v)} info={v} onSelected={handleSelected} />
                )}
            </VStack>
        </>
    );
});

type VideoThumbnailProps = {
    info: VideoInfo,
    onSelected: (info: VideoInfo) => void,
};

const VideoThumbnail = React.memo(({ info, onSelected }: VideoThumbnailProps) => {
    const [isShown, setIsShown] = useBoolean(false);

    const handleClick = e => {
        e.preventDefault();
        onSelected(info);
    };

    return (
        <Box
            as="button"
            w="100%"
            onClick={handleClick}
            onMouseEnter={() => setIsShown.on()}
            onMouseLeave={() => setIsShown.off()}>
            <Box
                position="relative"
                w="fit-content"
                m="0 auto"
                rounded="md"
                overflow="clip">
                <LazyLoadVideoThumbnail platform={info.platform} videoId={info.videoId} />
                <Fade in={isShown}>
                    <Box
                        position="absolute"
                        w="100%"
                        h="100%"
                        top={0}
                        left={0}
                        bgColor="rgba(0, 0, 0, 0.5)" />
                </Fade>
            </Box>
        </Box>
    );
});

type LazyLoadVideoThumbnailProps = {
    platform: string,
    videoId: string,
};

const LazyLoadVideoThumbnail = React.memo(({ platform, videoId }: LazyLoadVideoThumbnailProps) => {
    const [image, setImage] = React.useState<string>(null);
    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    React.useEffect(() => {
        storage.getVideoThumbnail(platform, videoId).then(image => {
            setImage(image);
        });
    }, [inView]);

    return (
        <Image ref={ref} src={image} w="100%" minW="320px" minH="180px" draggable={false} />
    );
});

export default VideoList;
