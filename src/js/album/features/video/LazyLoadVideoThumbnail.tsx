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
import { Image } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';

import * as storage from '../../../lib/background/storage';

type LazyLoadVideoThumbnailProps = {
    platform: string,
    videoId: string,
};
export const LazyLoadVideoThumbnail = React.memo(({ platform, videoId }: LazyLoadVideoThumbnailProps) => {
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
