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
import { Box, Button, Grid, HStack, Spacer, useBoolean, VStack } from '@chakra-ui/react';

import { getScreenshotKey, ScreenshotInfo, VideoInfo } from '../../../lib/types';
import { shareScreenshot } from '../../../lib/background/share-twitter';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { ScreenshotInfoWithThumbnail } from './selectedScreenshotSlice';
import { SelectedScreenshot } from './SelectedScreenshot';
import { LocalizedText } from '../../../lib/components/LocalizedText';
import { useSelector } from '../../store';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';
import { selectHashtags } from '../activeVideo/activeVideoSlice';

type SelectedScreenshotListProps = {
    video: VideoInfo,
    screenshots: ScreenshotInfoWithThumbnail[],
    onResize: (width: number, height: number) => void,
    onClick: (info: ScreenshotInfo) => void,
};

const SelectedScreenshotList = ({ video, screenshots, onResize, onClick }: SelectedScreenshotListProps) => {
    const [loaded, setLoaded] = useBoolean(false);
    const ref = useResizeObserver<HTMLDivElement>(onResize);
    const thumbPrefs = useSelector(selectThumbnailPreferences);
    const hashtags = useSelector(selectHashtags);

    const handleLoad = () => {
        setLoaded.on();
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        shareScreenshot(video, screenshots, hashtags);
    };

    if (screenshots.length === 0) {
        return null;
    }

    return (
        <HStack ref={ref}
                position="sticky"
                bottom={0}
                alignItems="flex-end"
                p="1rem"
                visibility={loaded ? 'visible' : 'hidden'}
                bg="gray.300">
            <Spacer />
            <VStack>
                <Grid w="100%"
                      gridTemplateColumns={`repeat(4, minmax(${thumbPrefs.width / 2}px, ${thumbPrefs.width}px))`}
                      gap={2}
                      flexWrap="nowrap"
                      justifyContent="center">
                    {screenshots.map(s =>
                        <SelectedScreenshot
                            key={getScreenshotKey(s)}
                            info={s}
                            screenshot={s.thumbnail}
                            onLoad={handleLoad}
                            onClick={onClick} />
                    )}
                </Grid>
            </VStack>
            <Box>
                <Button colorScheme="twitter" onClick={handleClick}><LocalizedText messageId="album_share_screenshot_button" /></Button>
            </Box>
            <Spacer />
        </HStack>
    );
};

export default React.memo(SelectedScreenshotList);
