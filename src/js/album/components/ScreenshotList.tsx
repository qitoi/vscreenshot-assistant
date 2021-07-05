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

import { getScreenshotKey, ScreenshotInfo, ScreenshotSummary, VideoInfo } from '../../lib/types';
import * as storage from '../../lib/background/storage';
import { ScreenshotSortOrder, sortScreenshot } from '../lib/ScreenshotSort';
import SelectedScreenshotList from './SelectedScreenshotList';

type ScreenshotListProps = {
    video: VideoInfo,
    sortOrder: ScreenshotSortOrder,
};

const thumbWidth = 320;

export default function ScreenshotList({ video, sortOrder }: ScreenshotListProps) {
    const [screenshots, setScreenshots] = React.useState<ScreenshotInfo[]>([]);
    const [selectedHeight, setSelectedHeight] = React.useState<number>(0);
    const [selected, dispatch] = React.useReducer(reducer, []);

    function reducer(state: ScreenshotSummary[], action: { type: string, screenshot: ScreenshotSummary }): ScreenshotSummary[] {
        if (action.type === 'update') {
            const screenshot = action.screenshot;
            if (state.some(s => s.info === screenshot.info)) {
                return state.filter(s => s.info !== screenshot.info);
            }
            else {
                if (state.length < 4) {
                    return [...state, screenshot];
                }
            }
        }
        return state;
    }

    React.useEffect(() => {
        storage.getScreenshotInfoList(video.platform, video.videoId)
            .then(screenshots => {
                setScreenshots(sortScreenshot(screenshots, sortOrder));
            });
    }, [video.platform, video.videoId, sortOrder]);

    React.useEffect(() => {
        setScreenshots(sortScreenshot(screenshots, sortOrder));
    }, [sortOrder]);

    const handleClickScreenshot = React.useCallback(screenshot => {
        dispatch({ type: 'update', screenshot });
    }, []);

    const handleRemoveSelected = React.useCallback(screenshot => {
        dispatch({ type: 'update', screenshot });
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
                        isChecked={selected.some(summary => summary.info === s)}
                        onClick={handleClickScreenshot} />
                ))}
            </Grid>
            <Box h="1rem" />
            {selected.length > 0 && (
                <SelectedScreenshotList
                    key={`${video.platform}-${video.videoId}`}
                    video={video}
                    screenshots={selected}
                    onResize={handleSelectedResize}
                    onClick={handleRemoveSelected} />
            )}
        </Box>
    );
}


type ScreenshotCardProps = React.PropsWithChildren<{
    info: ScreenshotInfo,
    isChecked: boolean,
    disabled: boolean,
    onClick: (summary: ScreenshotSummary) => void,
}>;

const ScreenshotCard = React.memo(({ info, isChecked, disabled, onClick }: ScreenshotCardProps) => {
    const [isShown, setIsShown] = useBoolean(false);
    const [isClickable, setIsClickable] = useBoolean(false);
    const ref = React.useRef<HTMLImageElement>(null);

    const handleClick = e => {
        e.preventDefault();
        if (isClickable && !disabled) {
            onClick({ info: info, thumbnail: ref.current.src });
        }
    };

    const handleLoad = React.useCallback(() => {
        setIsClickable.on();
    }, []);

    return (
        <Box as="button"
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
                onLoad={handleLoad} />
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
    onLoad?: () => void,
};

const LazyLoadScreenshotThumbnail = React.memo(React.forwardRef<HTMLImageElement, LazyLoadScreenshotThumbnail>(
    ({ platform, videoId, no, onLoad }, forwardedRef) => {
        const ref = React.useRef<HTMLImageElement>(null);
        const { ref: inViewRef, inView } = useInView({
            triggerOnce: true,
        });
        const refs = useMergeRefs(ref, inViewRef, forwardedRef);

        React.useEffect(() => {
            if (inView) {
                storage.getScreenshotThumbnail(platform, videoId, no).then(image => {
                    if (ref.current) {
                        ref.current.onload = onLoad;
                        ref.current.src = image;
                    }
                });
            }
        }, [inView, onLoad]);

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
