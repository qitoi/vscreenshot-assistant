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
import { AspectRatio, Image } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';

import * as storage from '../../../libs/storage';
import { useSelector } from '../../store';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';

type LazyLoadVideoThumbnailProps = {
    platform: string;
    videoId: string;
};

const LazyLoadVideoThumbnail = ({ platform, videoId }: LazyLoadVideoThumbnailProps) => {
    const [image, setImage] = React.useState<string | undefined>(undefined);
    const { ref, inView } = useInView({
        triggerOnce: true,
    });
    const thumbnailPreferences = useSelector(selectThumbnailPreferences);

    React.useEffect(() => {
        storage.getVideoResizedThumbnail(platform, videoId).then(image => {
            if (image !== null) {
                setImage(image);
            }
        });
    }, [inView, platform, videoId]);

    return (
        <AspectRatio
            w="100%"
            minW={`${thumbnailPreferences.width}px`}
            minH={`${thumbnailPreferences.height}px`}
            ratio={thumbnailPreferences.width / thumbnailPreferences.height}
            bgColor="white">
            <Image ref={ref} src={image} w={`${thumbnailPreferences.width}px`} draggable={false} style={{ objectFit: 'contain' }} />
        </AspectRatio>
    );
};

export default React.memo(LazyLoadVideoThumbnail);
