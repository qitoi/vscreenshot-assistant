/*
 *  Copyright 2023 qitoi
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
import { Image, useMergeRefs } from '@chakra-ui/react';

import { useDispatch } from '../../store';
import { ThumbnailAspectRatio } from '../../components/ThumbnailAspectRatio';
import useParameterizedSelector from '../../hooks/useParameterizedSelector';
import { removeThumbnail, selectCachedThumbnail } from './screenshotSlice';

export type ScreenshotThumbnailProps = {
    platform: string;
    videoId: string;
    no: number;
    loadThumbnail: (platform: string, videoId: string, no: number) => Promise<string>;
    onLoad: () => void;
    onVisible: () => void;
};

const ScreenshotThumbnail = React.forwardRef<HTMLImageElement, ScreenshotThumbnailProps>(
    function ScreenshotThumbnail({ platform, videoId, no, loadThumbnail, onLoad, onVisible }: ScreenshotThumbnailProps, forwardedRef) {
        const dispatch = useDispatch();
        const thumbnail = useParameterizedSelector(selectCachedThumbnail, platform, videoId, no);

        const ref = React.useRef<HTMLImageElement>(null);
        const refs = useMergeRefs(ref, forwardedRef);

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
                    loadThumbnail(platform, videoId, no).then(image => {
                        if (ref.current !== null && image !== null) {
                            ref.current.onload = () => {
                                if (ref.current !== null) {
                                    onLoad();
                                }
                            };
                            ref.current.src = image;
                        }
                    });
                    onVisible();
                }
            }
        }, [dispatch, loadThumbnail, thumbnail, platform, videoId, no, onLoad, onVisible]);

        return (
            <ThumbnailAspectRatio>
                <Image
                    ref={refs}
                    style={{ objectFit: 'contain' }}
                    draggable={false}
                    onLoad={onLoad} />
            </ThumbnailAspectRatio>
        );
    }
);

export default React.memo(ScreenshotThumbnail);
