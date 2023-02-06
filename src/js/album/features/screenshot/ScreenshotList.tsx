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

import { getScreenshotKey, ImageDataUrl, ScreenshotInfo } from '../../../libs/types';
import * as storage from '../../../libs/storage';
import * as datetime from '../../../libs/datetime';
import { decodeDataURL } from '../../../libs/data-url';
import * as platforms from '../../../platforms';
import { LocalizedText } from '../../../components/LocalizedText';
import CustomLightbox, { CustomLightboxSource } from '../../components/Lightbox/CustomLightbox';
import { useDispatch, useSelector } from '../../store';
import useParameterizedSelector from '../../hooks/useParameterizedSelector';
import SelectedScreenshotList from '../selectedScreenshot/SelectedScreenshotList';
import { selectActiveVideo } from '../activeVideo/activeVideoSlice';
import { fetchScreenshotList, selectScreenshotList } from './screenshotSlice';
import { isFulfilledSelectedScreenshot, removeSelectedScreenshot, selectSelectedScreenshot, toggleSelectedScreenshot, } from '../selectedScreenshot/selectedScreenshotSlice';
import { selectThumbnailPreferences, selectTweetEnabled } from '../preferences/preferencesSlice';
import ScreenshotCard from './ScreenshotCard';


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
    const [selectedHeight, setSelectedHeight] = React.useState<number>(0);
    const thumbnailPreferences = useSelector(selectThumbnailPreferences);
    const tweetEnabled = useSelector(selectTweetEnabled);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (video !== null) {
            setIsLoading(true);
            dispatch(fetchScreenshotList({ platform: video.platform, videoId: video.videoId }))
                .then(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, video]);

    const handleClickScreenshot = React.useCallback((info: ScreenshotInfo, thumbnail: ImageDataUrl) => {
        dispatch(toggleSelectedScreenshot({ info, thumbnail }));
    }, [dispatch]);

    const handleExpandScreenshot = React.useCallback((info: ScreenshotInfo) => {
        setLightboxIndex(screenshots.indexOf(info));
    }, [screenshots]);

    const handleRemoveSelected = React.useCallback((info: ScreenshotInfo) => {
        dispatch(removeSelectedScreenshot({ info }));
    }, [dispatch]);

    const handleSelectedResize = React.useCallback((width: number, height: number) => {
        setSelectedHeight(height);
    }, []);

    const handleLightboxClose = React.useCallback(() => setLightboxIndex(null), []);

    const fulfilled = isFulfilledSelectedScreenshot(selected);
    const tweetDisabled = video?.private || !tweetEnabled;
    const selectedSet = new Set<number>();
    let animeSelected = false;
    for (const s of selected) {
        selectedSet.add(s.no);
        if (s.anime) {
            animeSelected = true;
        }
    }

    return (
        <Box w="100%" h="100%" minH="100%" position="relative" userSelect="none">
            <Global styles={{
                // 選択済みのものはツイートが有効であれば常に選択可能
                '.screenshot-card-checked': {
                    cursor: tweetDisabled ? 'default' : 'pointer',
                },
                // 未選択のアニメ
                '.screenshot-card-unchecked.screenshot-card-anime': {
                    // ツイートが無効化されていればデフォルト、選択済みが一杯か、選択されているものがアニメでなければ無効化、それ以外は選択可能
                    cursor: tweetDisabled ? 'default' : (fulfilled || (selected.length > 0 && !animeSelected)) ? 'not-allowed' : 'pointer',
                },
                // 未選択のスクリーンショット
                '.screenshot-card-unchecked.screenshot-card-screenshot': {
                    // ツイートが無効化されていればデフォルト、選択済みが一杯か、選択されているものがアニメであれば無効化、それ以外は選択可能
                    cursor: tweetDisabled ? 'default' : (fulfilled || (selected.length > 0 && animeSelected)) ? 'not-allowed' : 'pointer',
                },
            }} />
            <Grid
                w="100%"
                minH={`calc(100% - 1rem - ${selectedHeight}px)`}
                p="1rem 1rem 0 1rem"
                templateColumns={`repeat(auto-fill, minmax(${thumbnailPreferences.width}px, 1fr))`}
                autoRows="min-content"
                gap={2}>
                {video !== null && screenshots.map(s => {
                    const isChecked = selectedSet.has(s.no);
                    const classNames = [];
                    classNames.push(isChecked ? 'screenshot-card-checked' : 'screenshot-card-unchecked');
                    classNames.push(s.anime ? 'screenshot-card-anime' : 'screenshot-card-screenshot');
                    return (
                        <ScreenshotCard
                            key={getScreenshotKey(s)}
                            className={classNames.join(' ')}
                            info={s}
                            disabled={tweetDisabled}
                            isChecked={isChecked}
                            onClick={handleClickScreenshot}
                            onExpandClick={handleExpandScreenshot} />
                    );
                })}
            </Grid>
            {isLoading && (
                <Box position="absolute" inset="0" display="flex" justifyContent="center" alignItems="center">
                    <Spinner color="blackAlpha.200" size="xl" thickness="4px" />
                </Box>
            )}
            <Box h="1rem" />
            {video !== null && (
                <SelectedScreenshotList
                    video={video}
                    screenshots={selected}
                    onResize={handleSelectedResize}
                    onClick={handleRemoveSelected} />
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
