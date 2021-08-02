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
import { AspectRatio, Box, Fade, Image, useBoolean } from '@chakra-ui/react';

import { ImageDataUrl, ScreenshotInfo } from '../../../lib/types';
import { useSelector } from 'react-redux';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';

type SelectedScreenshotProps = React.PropsWithChildren<{
    info: ScreenshotInfo,
    screenshot: ImageDataUrl,
    onClick: (info: ScreenshotInfo) => void,
    onLoad?: () => void,
}>;

export const SelectedScreenshot: React.FC<SelectedScreenshotProps> = ({ info, screenshot, onClick, onLoad }: SelectedScreenshotProps) => {
    const [isShown, setIsShown] = useBoolean(false);
    const thumbnailPreferences = useSelector(selectThumbnailPreferences);

    const handleClick = (e: React.MouseEvent<HTMLDivElement & HTMLButtonElement>) => {
        e.preventDefault();
        onClick(info);
    };

    return (
        <Box as="button"
             position="relative"
             rounded="md"
             overflow="clip"
             onClick={handleClick}
             onMouseEnter={() => setIsShown.on()}
             onMouseLeave={() => setIsShown.off()}>
            <Box>
                <AspectRatio w="100%" ratio={thumbnailPreferences.width / thumbnailPreferences.height}>
                    <Image src={screenshot} w="100%" style={{ objectFit: 'contain' }} draggable={false} onLoad={onLoad} />
                </AspectRatio>
                <Fade in={isShown}>
                    <Box w="100%" h="100%" position="absolute" top={0} left={0} bgColor="rgba(0, 0, 0, 0.5)" />
                </Fade>
            </Box>
        </Box>
    );
};
