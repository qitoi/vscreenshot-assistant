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

import * as storage from '../../../libs/storage';
import { useDispatch, useSelector } from '../../store';
import useParameterizedSelector from '../../hooks/useParameterizedSelector';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';
import { removeThumbnail, selectCachedThumbnail } from './screenshotSlice';

export type LazyLoadScreenshotThumbnail = {
    platform: string,
    videoId: string,
    no: number,
    onLoad: () => void,
    onVisible: () => void,
};

const LazyLoadScreenshotThumbnail = React.forwardRef<HTMLImageElement, LazyLoadScreenshotThumbnail>(
    ({ platform, videoId, no, onLoad, onVisible }: LazyLoadScreenshotThumbnail, forwardedRef) => {
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
                        if (ref.current !== null) {
                            onLoad();
                            onVisible();
                        }
                    };
                    ref.current.src = thumbnail;
                    dispatch(removeThumbnail({ platform, videoId, no }));
                }
            }
            else {
                if (ref.current && ref.current.src === '') {
                    if (inView) {
                        storage.getScreenshotThumbnail(platform, videoId, no).then(image => {
                            if (ref.current !== null && image !== null) {
                                ref.current.onload = () => {
                                    if (ref.current !== null) {
                                        onLoad();
                                    }
                                };
                                ref.current.src = image;
                            }
                        });
                    }
                    onVisible();
                }
            }
        }, [dispatch, thumbnail, platform, videoId, no, inView, onLoad, onVisible]);

        return (
            <AspectRatio
                w="100%"
                minW={`${thumbnailPreferences.width}px`}
                minH={`${thumbnailPreferences.height}px`}
                ratio={thumbnailPreferences.width / thumbnailPreferences.height}
                bgColor="white">
                <Image
                    ref={refs}
                    style={{ objectFit: 'contain' }}
                    draggable={false}
                    onLoad={onLoad} />
            </AspectRatio>
        );
    }
);

export default React.memo(LazyLoadScreenshotThumbnail);
