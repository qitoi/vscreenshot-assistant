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
import { Box, Button, Grid, HStack, useBoolean } from '@chakra-ui/react';

import { getScreenshotKey, ScreenshotInfo, VideoInfo } from '../../../lib/types';
import { shareScreenshot } from '../../../lib/background/share-twitter';
import { ScreenshotInfoWithThumbnail } from './selectedScreenshotSlice';
import { SelectedScreenshot } from './SelectedScreenshot';

type SelectedScreenshotListProps = {
    video: VideoInfo,
    screenshots: ScreenshotInfoWithThumbnail[],
    onResize: (height: number) => void,
    onClick: (info: ScreenshotInfo) => void,
};

const SelectedScreenshotList = React.memo(({ video, screenshots, onResize, onClick }: SelectedScreenshotListProps) => {
    const [loaded, setLoaded] = useBoolean(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (ref.current !== null) {
            const observer = new ResizeObserver(entries => {
                if (ref.current !== null) {
                    const h = ref.current.offsetHeight;
                    onResize(h);
                }
            });
            observer.observe(ref.current);
            return () => {
                observer.disconnect();
            };
        }
    }, [ref, onResize]);

    const handleLoad = () => {
        setLoaded.on();
    };

    const handleClick = e => {
        e.preventDefault();
        shareScreenshot(video.platform, video.videoId, screenshots);
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
            <Grid w="100%"
                  gridTemplateColumns="repeat(4, minmax(auto, 320px))"
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
                <Button colorScheme="twitter" onClick={handleClick}>Share</Button>
            </Box>
        </HStack>
    );
});
export default SelectedScreenshotList;
