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
import { AspectRatio, Image, useMergeRefs } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';

import * as storage from '../../../lib/background/storage';
import { useDispatch } from '../../store';
import useParameterizedSelector from '../../hooks/useParameterizedSelector';
import { removeThumbnail, selectCachedThumbnail } from './screenshotSlice';
import { useSelector } from 'react-redux';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';

export type LazyLoadScreenshotThumbnail = {
    platform: string,
    videoId: string,
    no: number,
    onLoad: () => void,
    onVisible: () => void,
};

export const LazyLoadScreenshotThumbnail = React.memo(React.forwardRef<HTMLImageElement, LazyLoadScreenshotThumbnail>(
    ({ platform, videoId, no, onLoad, onVisible }, forwardedRef) => {
        const dispatch = useDispatch();
        const thumbnail = useParameterizedSelector(selectCachedThumbnail, platform, videoId, no);
        const thumbnailPreferences = useSelector(selectThumbnailPreferences);

        const ref = React.useRef<HTMLImageElement>(null);
        const { ref: inViewRef, inView } = useInView({
            triggerOnce: true,
        });
        const refs = useMergeRefs(ref, inViewRef, forwardedRef);

        React.useEffect(() => {
            if (thumbnail !== null) {
                if (ref.current && ref.current.src === '') {
                    ref.current.onload = () => {
                        onLoad();
                        onVisible();
                    };
                    ref.current.src = thumbnail;
                    dispatch(removeThumbnail({ platform, videoId, no }));
                }
            }
            else {
                if (ref.current && ref.current.src === '') {
                    if (inView) {
                        storage.getScreenshotThumbnail(platform, videoId, no).then(image => {
                            if (ref.current) {
                                ref.current.onload = onLoad;
                                ref.current.src = image;
                            }
                        });
                    }
                    onVisible();
                }
            }
        }, [platform, videoId, no, inView, onLoad]);

        return (
            <AspectRatio
                w="100%"
                minW={`${thumbnailPreferences.width}px`}
                minH={`${thumbnailPreferences.height}px`}
                ratio={thumbnailPreferences.width / thumbnailPreferences.height}
            >
                <Image
                    ref={refs}
                    src=""
                    style={{ objectFit: 'contain' }}
                    draggable={false}
                    onLoad={onLoad} />
            </AspectRatio>
        );
    }
));
