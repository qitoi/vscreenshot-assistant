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
    Box,
    ChakraProvider,
    Flex,
} from '@chakra-ui/react';

import { useDispatch } from './stores/store';

import VideoList from './components/VideoList';
import Sidebar from './components/Sidebar';
import { appendVideo, removeVideo } from './stores/videoSlice';
import { appendScreenshot } from './stores/screenshotSlice';
import VideoHeader from './components/VideoHeader';
import ScreenshotList from './components/ScreenshotList';

export function App() {
    const dispatch = useDispatch();

    React.useEffect(() => {
        const callback = (changes: { [key: string]: chrome.storage.StorageChange }, area: chrome.storage.AreaName) => {
            if (area !== 'local') {
                return;
            }

            for (const [key, change] of Object.entries(changes)) {
                const type = key.substring(0, 3);
                switch (type) {
                    case 'v:i': {
                        if ('newValue' in change) {
                            dispatch(appendVideo(change.newValue));
                        }
                        else {
                            dispatch(removeVideo(change.oldValue));
                        }
                        break;
                    }
                    case 's:i': {
                        if ('newValue' in change) {
                            const [, , platform, videoId] = key.split(':');
                            const thumbnail = changes['s:t' + key.substring(3)].newValue;
                            dispatch(appendScreenshot({ platform, videoId, target: change.newValue, thumbnail: thumbnail }));
                        }
                        break;
                    }
                }
            }
        };
        chrome.storage.onChanged.addListener(callback);
        return () => chrome.storage.onChanged.removeListener(callback);
    }, []);

    return (
        <ChakraProvider>
            <Flex wrap="nowrap"
                  bgColor="gray.50"
                  draggable={false}>
                <Sidebar>
                    <VideoList />
                </Sidebar>
                <Flex direction="column" w="100%" h="calc(100vh)" minW={0} overflowX="hidden">
                    <VideoHeader />
                    <Box flexGrow={1} w="100%" overflowY="scroll">
                        <ScreenshotList />
                    </Box>
                </Flex>
            </Flex>
        </ChakraProvider>
    );
}
