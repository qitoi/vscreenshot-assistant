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
                    _focus: {
                        boxShadow: 'none',
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
            <Box>
                <Tabs>
                    <TabList position="sticky" top={0} bg="white" justifyContent="center">
                        <Tab><LocalizedText messageId="prefs_tab_preferences" /></Tab>
                        <Tab><LocalizedText messageId="prefs_tab_license" /></Tab>
                    </TabList>
                    <Box w="80%" maxW="100em" marginX="auto">
                        <TabPanels>
                            <TabPanel>
                                <PreferenceForm />
                            </TabPanel>
                            <TabPanel>
                                <Box fontSize="md" pb="1em">
                                    THE FOLLOWING SETS FORTH ATTRIBUTION NOTICES FOR THIRD PARTY SOFTWARE THAT MAY BE CONTAINED IN THIS APPLICATION.
                                </Box>
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
