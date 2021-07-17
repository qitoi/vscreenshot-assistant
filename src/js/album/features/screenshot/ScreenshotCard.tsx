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
import { Box, Checkbox, Fade, useBoolean } from '@chakra-ui/react';

import { ImageDataUrl, ScreenshotInfo } from '../../../lib/types';
import { LazyLoadScreenshotThumbnail } from './LazyLoadScreenshotThumbnail';

type ScreenshotCardProps = React.PropsWithChildren<{
    info: ScreenshotInfo,
    isChecked: boolean,
    disabled: boolean,
    onClick: (info: ScreenshotInfo, thumbnail: ImageDataUrl) => void,
}>;
export const ScreenshotCard = React.memo(({ info, isChecked, disabled, onClick }: ScreenshotCardProps) => {
    const [isShown, setIsShown] = useBoolean(false);
    const [isClickable, setIsClickable] = useBoolean(false);
    const ref = React.useRef<HTMLImageElement>(null);
    const [visible, setVisible] = useBoolean(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement & HTMLButtonElement>) => {
        e.preventDefault();
        if (isClickable && !disabled && ref.current !== null) {
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
             display={visible ? undefined : 'none'}
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
