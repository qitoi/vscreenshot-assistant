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
import { Box, ChakraProvider, Flex } from '@chakra-ui/react';

import * as prefs from '../lib/prefs';
import { useWatchStorageChange } from './hooks/useWatchStorageChange';
import { setPreferences } from './features/preferences/preferencesSlice';
import { useDispatch } from './store';
import Sidebar from './components/Sidebar';
import VideoHeader from './features/video/VideoHeader';
import VideoList from './features/video/VideoList';
import ScreenshotList from './features/screenshot/ScreenshotList';


export function App() {
    const dispatch = useDispatch();

    useWatchStorageChange();

    React.useEffect(() => {
        const onChanged = prefs.watch();
        const callback = (p: prefs.Preferences) => {
            dispatch(setPreferences(p));
        };
        prefs.loadPreferences().then(callback);
        onChanged.addEventListener(callback);
        return () => onChanged.removeEventListener(callback);
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
