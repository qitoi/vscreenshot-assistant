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
import { useNavigate, useLocation } from 'react-router-dom';

import { MessageId } from '../libs/localize';
import { LocalizedText } from '../components/LocalizedText';
import LicenseNoticeList from './features/license/LicenseNoticeList';
import PreferenceForm from './features/preference/PreferenceForm';
import Help from './features/help/Help';
import ChangeLog from './features/changelog/ChangeLog';

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
    },
});

type TabConfig = {
    hash: string,
    messageId: MessageId,
    panel: React.ReactElement,
};

const App: React.FC = () => {
    const location = useLocation();
    const { pathname, hash } = location;
    const navigate = useNavigate();
    const tabs = React.useMemo<TabConfig[]>(() => [
        {
            hash: '',
            messageId: 'options_tab_preferences',
            panel: (
                <PreferenceForm />
            ),
        },
        {
            hash: '#help',
            messageId: 'options_tab_help',
            panel: (
                <Help />
            ),
        },
        {
            hash: '#license',
            messageId: 'options_tab_license',
            panel: (
                <LicenseNoticeList />
            ),
        },
        {
            hash: '#changelog',
            messageId: 'options_tab_changelog',
            panel: (
                <ChangeLog />
            ),
        },
    ], []);

    const initialIndex = tabs.findIndex(t => t.hash === hash);
    const [index, setIndex] = React.useState<number>((initialIndex !== -1) ? initialIndex : 0);

    React.useEffect(() => {
        const index = tabs.findIndex(t => t.hash === hash);
        // ハッシュが変更されたとき、一致するタブがあればそれに切り替え
        if (index !== -1) {
            setIndex(index);
        }
        // なければデフォルトとして0に切り替え、履歴も置き換える
        else {
            setIndex(0);
            navigate(pathname, { replace: true });
        }
    }, [pathname, hash, navigate, tabs]);

    const handleChange = (index: number) => {
        // タブが変更されたとき、表示内容を切り替え、履歴も置き換える
        setIndex(index);
        navigate(location.pathname + tabs[index].hash, { replace: true });
    };

    return (
        <ChakraProvider theme={theme}>
            <Box h="100vh" minH="fit-content" overflow="clip" fontSize="sm">
                <Tabs index={index} onChange={handleChange} colorScheme="gray" align="start" orientation="vertical" h="100%">
                    <TabList bgColor="gray.500" color="white" w="16em" flexShrink={0}>
                        <Box py="1em" fontSize="lg" textAlign="center"><LocalizedText messageId="extension_name" /></Box>
                        {tabs.map(tab => (
                            <Tab key={tab.hash}><LocalizedText messageId={tab.messageId} /></Tab>
                        ))}
                    </TabList>
                    <Box w="100%" h="100%" marginX="auto">
                        <TabPanels h="100%" position="relative">
                            {tabs.map(tab => (
                                <TabPanel key={tab.hash} h="100%" p={0} overflowY="scroll">
                                    {tab.panel}
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </Box>
                </Tabs>
            </Box>
        </ChakraProvider>
    );
};

export default App;
