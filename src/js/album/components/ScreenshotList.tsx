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
import { Box, Checkbox, Fade, Grid, Image, useBoolean, useMergeRefs } from '@chakra-ui/react';
import { useInView } from 'react-intersection-observer';

import {
    compareScreenshotInfo,
    getScreenshotKey,
    ImageDataUrl,
    ScreenshotInfo,
} from '../../lib/types';
import * as storage from '../../lib/background/storage';
import SelectedScreenshotList from './SelectedScreenshotList';

import { useDispatch, useSelector } from '../stores/store';
import useParameterizedSelector from '../hooks/useParameterizedSelector';
import {
    fetchScreenshotList,
    removeThumbnail,
    selectCachedThumbnail,
    selectScreenshotList,
} from '../stores/screenshotSlice';
import {
    toggleSelectedScreenshot,
    removeSelectedScreenshot,
    selectSelectedScreenshot,
} from '../stores/selectedScreenshotSlice';
import { selectActiveVideo } from '../stores/videoSlice';

const thumbWidth = 320;

export default function ScreenshotList() {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);
    const screenshots = useSelector(selectScreenshotList(video?.platform, video?.videoId));
    const selected = useSelector(selectSelectedScreenshot);
    const [selectedHeight, setSelectedHeight] = React.useState<number>(0);

    React.useEffect(() => {
        if (video !== null) {
            dispatch(fetchScreenshotList({ platform: video.platform, videoId: video.videoId }));
        }
    }, [video]);

    const handleClickScreenshot = React.useCallback((info: ScreenshotInfo, thumbnail: ImageDataUrl) => {
        dispatch(toggleSelectedScreenshot({ info, thumbnail }));
    }, []);

    const handleRemoveSelected = React.useCallback((info: ScreenshotInfo) => {
        dispatch(removeSelectedScreenshot({ info }));
    }, []);

    const handleSelectedResize = React.useCallback(height => {
        setSelectedHeight(height);
    }, []);

    return (
        <Box w="100%" h="100%" minH="100%">
            <Grid
                w="100%"
                minH={`calc(100% - 1rem - ${selectedHeight}px)`}
                p="1rem 1rem 0 1rem"
                templateColumns={`repeat(auto-fill, minmax(${thumbWidth}px, 1fr))`}
                autoRows="min-content"
                gap={2}>
                {screenshots.map(s => (
                    <ScreenshotCard
                        key={getScreenshotKey(s)}
                        info={s}
                        disabled={video.private}
                        isChecked={selected.some(ss => compareScreenshotInfo(ss, s))}
                        onClick={handleClickScreenshot} />
                ))}
            </Grid>
            <Box h="1rem" />
            <SelectedScreenshotList
                video={video}
                screenshots={selected}
                onResize={handleSelectedResize}
                onClick={handleRemoveSelected} />
        </Box>
    );
}


type ScreenshotCardProps = React.PropsWithChildren<{
    info: ScreenshotInfo,
    isChecked: boolean,
    disabled: boolean,
    onClick: (info: ScreenshotInfo, thumbnail: ImageDataUrl) => void,
}>;

const ScreenshotCard = React.memo(({ info, isChecked, disabled, onClick }: ScreenshotCardProps) => {
    const [isShown, setIsShown] = useBoolean(false);
    const [isClickable, setIsClickable] = useBoolean(false);
    const ref = React.useRef<HTMLImageElement>(null);
    const [visible, setVisible] = useBoolean(false);

    const handleClick = e => {
        e.preventDefault();
        if (isClickable && !disabled) {
            onClick(info, ref.current.src);
        }
    };

    const handleLoad = React.useCallback(() => {
        setIsClickable.on();
    }, []);

    const handleVisible = React.useCallback(() => {
        setVisible.on();
    }, []);

    return (
        <Box as="button"
             display={visible ? null : 'none'}
             position="relative"
             rounded="md"
             overflow="clip"
             onClick={handleClick}
             cursor={disabled ? 'default' : 'pointer'}
             onMouseEnter={() => setIsShown.on()}
             onMouseLeave={() => setIsShown.off()}>
            <LazyLoadScreenshotThumbnail
                ref={ref}
                platform={info.platform}
                videoId={info.videoId}
                no={info.no}
                onLoad={handleLoad}
                onVisible={handleVisible} />
            <Fade in={isShown || isChecked}>
                <Box w="100%" h="100%" position="absolute" top={0} left={0} bgColor="rgba(0, 0, 0, 0.5)" />
            </Fade>
            {!disabled && <Checkbox isChecked={isChecked} position="absolute" p={1} top={0} left={0} />}
        </Box>
    );
});

type LazyLoadScreenshotThumbnail = {
    platform: string,
    videoId: string,
    no: number,
    onLoad: () => void,
    onVisible: () => void,
};

const LazyLoadScreenshotThumbnail = React.memo(React.forwardRef<HTMLImageElement, LazyLoadScreenshotThumbnail>(
    ({ platform, videoId, no, onLoad, onVisible }, forwardedRef) => {
        const dispatch = useDispatch();
        const thumbnail = useParameterizedSelector(selectCachedThumbnail, platform, videoId, no);

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
            <Image
                ref={refs}
                src=""
                w="100%"
                minW={`${thumbWidth}px`}
                minH="180px"
                draggable={false}
                onLoad={onLoad} />
        );
    }
));
