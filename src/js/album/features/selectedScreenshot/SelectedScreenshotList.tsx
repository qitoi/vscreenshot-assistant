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
import { Box, Button, Grid, HStack, Spacer, StackProps, useBoolean } from '@chakra-ui/react';

import { getScreenshotKey, ScreenshotInfo, VideoInfo } from '../../../libs/types';
import { LocalizedText } from '../../../components/LocalizedText';
import * as client from '../../../messages/client';
import { useSelector } from '../../store';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';
import { selectHashtags } from '../activeVideo/activeVideoSlice';
import { ScreenshotInfoWithThumbnail } from './selectedScreenshotSlice';
import { SelectedScreenshot } from './SelectedScreenshot';

type SelectedScreenshotListProps = {
    video: VideoInfo,
    screenshots: ScreenshotInfoWithThumbnail[],
    onResize: (width: number, height: number) => void,
    onClick: (info: ScreenshotInfo) => void,
} & Omit<StackProps, 'onResize' | 'onClick'>;

const SelectedScreenshotList = ({ video, screenshots, onResize, onClick, ...stackProps }: SelectedScreenshotListProps) => {
    const [loaded, setLoaded] = useBoolean(false);
    const ref = useResizeObserver<HTMLDivElement>(onResize);
    const thumbPrefs = useSelector(selectThumbnailPreferences);
    const hashtags = useSelector(selectHashtags);

    const handleLoad = () => {
        setLoaded.on();
    };

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await client.sendMessage('share-screenshot', { video, screenshots, hashtags });
    };

    if (screenshots.length === 0) {
        return null;
    }

    return (
        <HStack
            {...stackProps}
            ref={ref}
            alignItems="flex-end"
            visibility={loaded ? 'visible' : 'hidden'}
            bg="gray.300">
            <Spacer />
            <Grid gridTemplateColumns={`repeat(4, minmax(${thumbPrefs.width / 4}px, ${thumbPrefs.width}px))`}
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
            <Box>
                <Button
                    onClick={handleClick}
                    color="white"
                    bgColor="rgb(29, 155, 240)"
                    _hover={{ backgroundColor: 'rgb(26, 140, 216)' }}
                    _active={{ backgroundColor: 'rgb(23, 124, 192)' }}>
                    <LocalizedText messageId="album_tweet_screenshot_button" />
                </Button>
            </Box>
            <Spacer />
        </HStack>
    );
};

export default React.memo(SelectedScreenshotList);
