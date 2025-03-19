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
import { AspectRatio } from '@chakra-ui/react';

import { selectThumbnailPreferences } from '../features/preferences/preferencesSlice';
import { useSelector } from '../store';


type ThumbnailAspectRatioProps = React.PropsWithChildren<{}>;

export function ThumbnailAspectRatio({ children }: ThumbnailAspectRatioProps) {
    const thumbnailPreferences = useSelector(selectThumbnailPreferences);
    return (
        <AspectRatio
            w="100%"
            minW={`${thumbnailPreferences.width}px`}
            minH={`${thumbnailPreferences.height}px`}
            ratio={thumbnailPreferences.width / thumbnailPreferences.height}
            bgColor="white">
            {children}
        </AspectRatio>
    );
}
