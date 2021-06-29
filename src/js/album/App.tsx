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
import {
    ChakraProvider,
    Flex,
} from '@chakra-ui/react';

import VideoList from './components/VideoList';
import Sidebar from './components/Sidebar';
import VideoContents from './components/VideoContents';

import { VideoInfo } from '../lib/types';

export function App() {
    const [video, setVideo] = React.useState<VideoInfo>(null);

    const handleSelect = v => {
        setVideo(v);
    };

    return (
        <ChakraProvider>
            <Flex wrap="nowrap"
                  bgColor="gray.50"
                  draggable={false}>
                <Sidebar>
                    <VideoList onSelect={handleSelect} />
                </Sidebar>
                <VideoContents video={video} />
            </Flex>
        </ChakraProvider>
    );
}
