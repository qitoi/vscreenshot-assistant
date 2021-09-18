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
import { Box, ChakraProvider, extendTheme, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import { LocalizedText } from '../lib/components/LocalizedText';
import LicenseNoticeList from './features/license/LicenseNoticeList';
import PreferenceForm from './features/preference/PreferenceForm';

const theme = extendTheme({
    boxShadow: 'none',
    components: {
        Tabs: {
            baseStyle: {
                tab: {
                    transition: 'background ease-out 200ms',
                    _hover: {
                        background: 'whiteAlpha.50'
                    },
                    _focus: {
                        boxShadow: 'none',
                    },
                    _selected: {
                        background: 'whiteAlpha.900',
                    },
                }
            },
        },
        Accordion: {
            baseStyle: {
                button: {
                    _focus: {
                        boxShadow: 'none',
                    },
                }
            },
        },
        Radio: {
            baseStyle: {
                control: {
                    _focus: {
                        boxShadow: 'none',
                    },
                },
            },
        },
        Switch: {
            baseStyle: {
                track: {
                    _focus: {
                        boxShadow: 'none',
                    },
                },
            },
        },
    }
});

const App: React.FC = () => {
    return (
        <ChakraProvider theme={theme}>
            <Box h="100vh" minH="fit-content" overflow="clip" fontSize="sm">
                <Tabs colorScheme="gray" align="start" orientation="vertical" h="100%">
                    <TabList bgColor="gray.500" color="white" w="20em">
                        <Box py="1em" fontSize="lg" textAlign="center">VScreenshot Assistant</Box>
                        <Tab><LocalizedText messageId="prefs_tab_preferences" /></Tab>
                        <Tab><LocalizedText messageId="prefs_tab_license" /></Tab>
                    </TabList>
                    <Box w="100%" h="100%" marginX="auto">
                        <TabPanels h="100%" position="relative">
                            <TabPanel h="100%" p={0} overflowY="scroll">
                                <PreferenceForm />
                            </TabPanel>
                            <TabPanel h="100%" p={0} overflowY="scroll">
                                <LicenseNoticeList />
                            </TabPanel>
                        </TabPanels>
                    </Box>
                </Tabs>
            </Box>
        </ChakraProvider>
    );
};

export default App;
