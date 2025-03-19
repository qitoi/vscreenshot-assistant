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
import { Box, useBoolean } from '@chakra-ui/react';

import { VideoInfo } from '../../../libs/types';
import { FadeBox } from '../../components/FadeBox';
import LazyLoadVideoThumbnail from './LazyLoadVideoThumbnail';

type VideoThumbnailProps = {
    info: VideoInfo;
    onSelected: (info: VideoInfo) => void;
};

const VideoThumbnail = ({ info, onSelected }: VideoThumbnailProps) => {
    const [isShown, setIsShown] = useBoolean(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement & HTMLButtonElement>) => {
        e.preventDefault();
        onSelected(info);
    };

    return (
        <Box
            as="button"
            onClick={handleClick}
            onMouseEnter={() => setIsShown.on()}
            onMouseLeave={() => setIsShown.off()}>
            <Box
                position="relative"
                w="100%"
                m="0 auto"
                rounded="md"
                overflow="clip">
                <LazyLoadVideoThumbnail platform={info.platform} videoId={info.videoId} />
                <FadeBox show={isShown} />
            </Box>
        </Box>
    );
};

export default React.memo(VideoThumbnail);
