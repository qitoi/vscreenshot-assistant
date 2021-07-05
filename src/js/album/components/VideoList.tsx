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
import { Box, Center, Divider, Fade, Image, Select, useBoolean, VStack } from '@chakra-ui/react';
import { VideoInfo } from '../../lib/types';
import { useInView } from 'react-intersection-observer';
import * as storage from '../../lib/background/storage';
import { loadVideoSortOrder, saveVideoSortOrder, sortVideo, VideoSortOrder, VideoSortOrders } from '../lib/VideoSort';

type VideoListProps = {
    onSelect: (video: VideoInfo) => void
};

export default function VideoList({ onSelect }: VideoListProps) {
    const [videos, setVideos] = React.useState<VideoInfo[]>([]);
    const [order, setOrder] = React.useState<VideoSortOrder>(loadVideoSortOrder());

    React.useEffect(() => {
        storage.getVideoInfoList()
            .then(videos => {
                setVideos(sortVideo(videos, order));
            });
    }, []);

    const handleChangeSortOrder = e => {
        const order = e.target.value;
        saveVideoSortOrder(order);
        setVideos(sortVideo(videos, order));
        setOrder(order);
    };

    const handleSelected = video => {
        onSelect(video);
    };

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
                    <>
                        <VideoThumbnail key={`${v.platform}-${v.videoId}`} info={v} onSelected={handleSelected} />
                        <Divider />
                    </>
                )}
            </VStack>
        </>
    );
}

type VideoThumbnailProps = {
    info: VideoInfo,
    onSelected: (info: VideoInfo) => void,
};

function VideoThumbnail({ info, onSelected }: VideoThumbnailProps) {
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
}

type LazyLoadVideoThumbnailProps = {
    platform: string,
    videoId: string,
};

function LazyLoadVideoThumbnail({ platform, videoId }: LazyLoadVideoThumbnailProps) {
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
}
