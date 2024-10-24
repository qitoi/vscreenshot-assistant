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
import { Box, Grid, HStack, Link, Spinner, Text } from '@chakra-ui/react';
import { Global } from '@emotion/react';

import { getScreenshotKey, ImageDataUrl, ScreenshotInfo, VideoInfo } from '../../../libs/types';
import * as storage from '../../../libs/storage';
import * as datetime from '../../../libs/datetime';
import { decodeDataURL } from '../../../libs/data-url';
import * as platforms from '../../../platforms';
import { LocalizedText } from '../../../components/LocalizedText';
import { VirtualGridContainer, VirtualGrid } from '../../components/VirtualGrid';
import CustomLightbox, { CustomLightboxSource } from '../../components/Lightbox/CustomLightbox';
import { useDispatch, useSelector } from '../../store';
import useParameterizedSelector from '../../hooks/useParameterizedSelector';
import SelectedScreenshotList from '../selectedScreenshot/SelectedScreenshotList';
import { selectActiveVideo } from '../activeVideo/activeVideoSlice';
import { fetchScreenshotList, selectScreenshotList } from './screenshotSlice';
import { isFulfilledSelectedScreenshot, removeSelectedScreenshot, selectSelectedScreenshot, toggleSelectedScreenshot, } from '../selectedScreenshot/selectedScreenshotSlice';
import { selectAlbumPreferences, selectThumbnailPreferences, selectTweetEnabled } from '../preferences/preferencesSlice';
import ScreenshotCard from './ScreenshotCard';


type ScreenshotGridProps = {
    video: VideoInfo,
    screenshots: ScreenshotInfo[],
    enableTweet: boolean,
    onScreenshotExpandClick: (s: ScreenshotInfo) => void,
};

function ScreenshotGrid({ video, screenshots, enableTweet, onScreenshotExpandClick }: ScreenshotGridProps) {
    const dispatch = useDispatch();
    const albumPreferences = useSelector(selectAlbumPreferences);
    const thumbnailPreferences = useSelector(selectThumbnailPreferences);
    const selected = useSelector(selectSelectedScreenshot);

    const thumbnailCacheRef = React.useRef<Map<number, string | null>>(new Map<number, string | null>());
    React.useEffect(() => {
        for (const image of thumbnailCacheRef.current.values()) {
            if (image) {
                URL.revokeObjectURL(image);
            }
        }
        thumbnailCacheRef.current = new Map<number, string | null>();
    }, [video]);

    const loadThumbnail = React.useCallback(async (platform: string, videoId: string, no: number): Promise<string> => {
        const cache = thumbnailCacheRef.current.get(no);
        if (cache !== undefined) {
            return cache ?? '';
        }
        const image = await storage.getScreenshotThumbnail(platform, videoId, no);
        if (image) {
            const obj = URL.createObjectURL(decodeDataURL(image));
            thumbnailCacheRef.current.set(no, obj);
            return obj;
        }
        return '';
    }, []);

    const [selectedHeight, setSelectedHeight] = React.useState<number>(0);
    const handleSelectedResize = React.useCallback((width: number, height: number) => {
        setSelectedHeight(height);
    }, []);

    const handleClickScreenshot = React.useCallback((info: ScreenshotInfo, thumbnail: ImageDataUrl) => {
        dispatch(toggleSelectedScreenshot({ info, thumbnail }));
    }, [dispatch]);

    const handleRemoveSelected = React.useCallback((info: ScreenshotInfo) => {
        dispatch(removeSelectedScreenshot({ info }));
    }, [dispatch]);

    const renderScreenshotCard = React.useCallback((s: ScreenshotInfo, isChecked: boolean, lazyLoad: boolean) => {
        const classNames = [];
        classNames.push(isChecked ? 'screenshot-card-checked' : 'screenshot-card-unchecked');
        return (
            <ScreenshotCard
                key={getScreenshotKey(s)}
                className={classNames.join(' ')}
                info={s}
                lazyLoad={lazyLoad}
                loadThumbnail={loadThumbnail}
                disabled={!enableTweet}
                isChecked={isChecked}
                onClick={handleClickScreenshot}
                onExpandClick={onScreenshotExpandClick} />
        );
    }, [loadThumbnail, enableTweet, handleClickScreenshot, onScreenshotExpandClick]);

    const selectedSet = new Set<number>();
    for (const s of selected) {
        selectedSet.add(s.no);
    }

    return albumPreferences.enabledVirtualScroll ? (
        <VirtualGridContainer w="100%" h="100%" overflowX="clip" overflowY="scroll">
            <VirtualGrid<ScreenshotInfo>
                items={screenshots}
                getItemKey={s => getScreenshotKey(s)}
                renderItem={s => renderScreenshotCard(s, selectedSet.has(s.no), false)}
                p="1rem"
                flex={1}
                templateColumns={`repeat(auto-fill, minmax(${thumbnailPreferences.width}px, 1fr))`}
                autoRows="min-content"
                gap={2} />
            <SelectedScreenshotList
                video={video}
                screenshots={selected}
                onResize={handleSelectedResize}
                onClick={handleRemoveSelected}
                position="sticky"
                w="100%"
                minW="fit-content"
                bottom={0}
                p="1rem" />
        </VirtualGridContainer>
    ) : (
        <Box h="100%" overflowY="scroll">
            <Grid
                w="100%"
                minH={`calc(100% - 1rem - ${selectedHeight}px)`}
                p="1rem 1rem 0 1rem"
                templateColumns={`repeat(auto-fill, minmax(${thumbnailPreferences.width}px, 1fr))`}
                autoRows="min-content"
                gap={2}>
                {video !== null && screenshots.map(s => renderScreenshotCard(s, selectedSet.has(s.no), true))}
            </Grid>
            <Box h="1rem" />
            <SelectedScreenshotList
                video={video}
                screenshots={selected}
                onResize={handleSelectedResize}
                onClick={handleRemoveSelected}
                position="sticky"
                w="100%"
                minW="fit-content"
                bottom={0}
                p="1rem" />
        </Box>
    );
}


const ScreenshotList: React.FC = () => {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);
    const screenshots = useParameterizedSelector(selectScreenshotList, video?.platform ?? '', video?.videoId ?? '');
    const lightboxSource = React.useMemo<CustomLightboxSource[]>(() => screenshots.map(s => ({
        key: getScreenshotKey(s),
        load: async () => {
            const image = await storage.getScreenshot(s.platform, s.videoId, s.no);
            return image ? decodeDataURL(image) : null;
        },
        renderFooter: () => {
            const url = platforms.getVideoPosUrl(s.platform, s.videoId, s.pos);
            const videoPos = (
                <>
                    <LocalizedText messageId="album_screenshot_video_pos" />: {s.pos.toFixed(2)}
                    <LocalizedText messageId="album_screenshot_video_pos_unit" />
                </>
            );
            return (
                <HStack spacing={8}>
                    <Box><LocalizedText messageId="album_screenshot_capture_date" />: {datetime.format(s.datetime)}</Box>
                    <Box>
                        {url ? (
                            <Link href={url} isExternal={true}>{videoPos}</Link>
                        ) : (
                            <Text>{videoPos}</Text>
                        )}
                    </Box>
                </HStack>
            );
        },
    })), [screenshots]);
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
    const selected = useSelector(selectSelectedScreenshot);
    const tweetEnabled = useSelector(selectTweetEnabled);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const handleExpandScreenshot = React.useCallback((info: ScreenshotInfo) => {
        setLightboxIndex(screenshots.indexOf(info));
    }, [screenshots]);

    React.useEffect(() => {
        if (video !== null) {
            setIsLoading(true);
            dispatch(fetchScreenshotList({ platform: video.platform, videoId: video.videoId }))
                .then(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, video]);

    const handleLightboxClose = React.useCallback(() => setLightboxIndex(null), []);

    const fulfilled = isFulfilledSelectedScreenshot(selected);
    const tweetDisabled = video?.private || !tweetEnabled;

    return (
        <Box w="100%" h="100%" minH="100%" position="relative" userSelect="none">
            <Global styles={{
                // 選択済みのものはツイートが有効であれば常に選択可能
                '.screenshot-card-checked': {
                    cursor: tweetDisabled ? 'default' : 'pointer',
                },
                // 未選択のスクリーンショット
                '.screenshot-card-unchecked': {
                    // ツイートが無効化されていればデフォルト、選択済みが一杯であれば無効化、それ以外は選択可能
                    cursor: tweetDisabled ? 'default' : (fulfilled) ? 'not-allowed' : 'pointer',
                },
            }} />
            {video !== null && (
                <ScreenshotGrid
                    video={video}
                    screenshots={screenshots}
                    enableTweet={!tweetDisabled}
                    onScreenshotExpandClick={handleExpandScreenshot} />
            )}
            {isLoading && (
                <Box position="absolute" inset="0" display="flex" justifyContent="center" alignItems="center">
                    <Spinner color="blackAlpha.200" size="xl" thickness="4px" />
                </Box>
            )}
            {lightboxIndex !== null && (<CustomLightbox
                list={lightboxSource}
                index={lightboxIndex ?? 0}
                loop={true}
                open={true}
                onClose={handleLightboxClose} />)}
        </Box>
    );
};

export default ScreenshotList;
