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
    chakra,
    Code,
    Link,
    ListItem,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    UnorderedList,
    VStack,
} from '@chakra-ui/react';

import { LocalizedText } from '../../../components/LocalizedText';
import * as prefs from '../../../libs/prefs';
import * as hotkeys from '../../../libs/hotkeys';


const Block = chakra('div', {
    baseStyle: {
        w: '100%',
    },
});

const H1 = chakra('h1', {
    baseStyle: {
        fontSize: '3xl',
        fontWeight: 'bold',
        paddingBottom: '0.5em',
        paddingLeft: '16px',
        borderBottom: '2px solid',
        borderColor: 'gray.400',
    },
});

const H2 = chakra('h2', {
    baseStyle: {
        fontSize: '2xl',
        fontWeight: 'bold',
        py: '0.5em',
        paddingLeft: '16px',
        borderBottom: '2px solid',
        borderColor: 'gray.300',
    },
});

const H3 = chakra('h3', {
    baseStyle: {
        fontSize: 'xl',
        fontWeight: 'bold',
        py: '0.5em',
        paddingLeft: '16px',
        borderBottom: '2px solid',
        borderColor: 'gray.200',
    },
});

const H4 = chakra('h4', {
    baseStyle: {
        fontSize: 'lg',
        fontWeight: 'bold',
        py: '0.5em',
        paddingLeft: '16px',
        borderBottom: '2px solid',
        borderColor: 'gray.100',
    },
});

const Description = chakra('div', {
    baseStyle: {
        p: '1em',
    },
});


type KeyConfigs = {
    screenshot: string,
    continuous: string,
    animation: string,
};


const Help: React.FC = () => {
    const [keyConfigs, setKeyConfigs] = React.useState<KeyConfigs | null>(null);

    React.useEffect(() => {
        const event = prefs.watch();
        const listener = (prefs: prefs.Preferences) => {
            setKeyConfigs({
                screenshot: hotkeys.getHotkeyString(prefs.screenshot.hotkey),
                continuous: hotkeys.getHotkeyString(prefs.screenshot.continuousHotkey),
                animation: hotkeys.getHotkeyString(prefs.animation.hotkey),
            });
        };
        prefs.loadPreferences().then(listener);
        event.addListener(listener);
        return () => event.removeListener(listener);
    }, []);

    if (keyConfigs === null) {
        return null;
    }

    return (
        <VStack maxW="56em" py="4em" mx="auto" fontSize="md" spacing="2em">
            <Block>
                <H1><LocalizedText messageId="extension_name" /></H1>
                <Description>
                    <Text><LocalizedText messageId="help_app_description" /></Text>
                </Description>
            </Block>
            <Block>
                <H2><LocalizedText messageId="help_usage" /></H2>
                <Description>
                    <H3><LocalizedText messageId="help_usage_capture" /></H3>
                    <Description>
                        <Text><LocalizedText messageId="help_usage_capture_text" /></Text>
                    </Description>
                    <Description>
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th fontSize="md"><LocalizedText messageId="help_usage_capture_feature" /></Th>
                                    <Th fontSize="md"><LocalizedText messageId="help_usage_capture_feature_key_binding" /></Th>
                                    <Th fontSize="md"><LocalizedText messageId="help_usage_capture_feature_text" /></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                <Tr>
                                    <Td whiteSpace="nowrap"><LocalizedText messageId="help_usage_capture_screenshot" /></Td>
                                    <Td whiteSpace="nowrap">{keyConfigs.screenshot}</Td>
                                    <Td whiteSpace="pre-wrap"><LocalizedText messageId="help_usage_capture_screenshot_text" /></Td>
                                </Tr>
                                <Tr>
                                    <Td whiteSpace="nowrap"><LocalizedText messageId="help_usage_capture_continuous_screenshot" /></Td>
                                    <Td whiteSpace="nowrap">{keyConfigs.continuous}</Td>
                                    <Td whiteSpace="pre-wrap"><LocalizedText
                                        messageId="help_usage_capture_continuous_screenshot_text" /></Td>
                                </Tr>
                                <Tr>
                                    <Td whiteSpace="nowrap"><LocalizedText messageId="help_usage_capture_animation" /></Td>
                                    <Td whiteSpace="nowrap">{keyConfigs.animation}</Td>
                                    <Td whiteSpace="pre-wrap"><LocalizedText messageId="help_usage_capture_animation_text" /></Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </Description>
                </Description>
                <Description>
                    <H3><LocalizedText messageId="help_usage_album" /></H3>
                    <Description>
                        <Text whiteSpace="pre-wrap"><LocalizedText messageId="help_usage_album_text" /></Text>
                    </Description>
                    <H4><LocalizedText messageId="help_usage_save" /></H4>
                    <Description>
                        <Text whiteSpace="pre-wrap"><LocalizedText messageId="help_usage_save_text" /></Text>
                    </Description>
                    <H4><LocalizedText messageId="help_usage_tweet" /></H4>
                    <Description>
                        <Text whiteSpace="pre-wrap"><LocalizedText messageId="help_usage_tweet_text" /></Text>
                    </Description>
                </Description>
            </Block>
            <Block>
                <H2><LocalizedText messageId="help_supported_platforms" /></H2>
                <Description>
                    <UnorderedList p="1em">
                        <ListItem><LocalizedText messageId="help_supported_platform_youtube" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_twitch" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_nicovideo" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_spwn" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_streaming_plus" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_hololive_fc" /></ListItem>
                        <ListItem><LocalizedText messageId="help_supported_platform_tokinosora_fc" /></ListItem>
                    </UnorderedList>
                </Description>
            </Block>
            <Block>
                <H2><LocalizedText messageId="help_source_code" /></H2>
                <Description>
                    <Link href="https://github.com/qitoi/vscreenshot-assistant" target="_blank">
                        https://github.com/qitoi/vscreenshot-assistant
                    </Link>
                </Description>
            </Block>
            <Block>
                <H2><LocalizedText messageId="help_license" /></H2>
                <Description display="flex" flexDirection="column" gap="1em">
                    <Block>Apache License 2.0</Block>
                    <Code w="100%">
                        <chakra.pre p="1em" whiteSpace="pre-wrap">
                            {`Copyright 2021 qitoi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`}
                        </chakra.pre>
                    </Code>
                </Description>
            </Block>
        </VStack>
    );
};

export default Help;
