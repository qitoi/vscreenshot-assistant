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
import { Box, HStack } from '@chakra-ui/react';

import { ClickIconAction, ClickIconActions, Preferences, ToastPosition, ToastPositions } from '../../../lib/prefs';
import { MessageId } from '../../../lib/localize';
import SwitchControl from '../../components/SwitchControl';
import ControlGroup from '../../components/ControlGroup';
import LabeledControl from '../../components/LabeledControl';
import RadioItem from '../../components/RadioItem';
import RadioGroupControl from '../../components/RadioGroupControl';
import NumberInputControl from '../../components/NumberInputControl';
import PreferenceBlock from './PreferenceBlock';

const GeneralPreferences: React.FC = () => {
    const toastPositionItems: Record<ToastPosition, MessageId> = {
        [ToastPositions.LeftBottom]: 'prefs_general_notify_position_bottom_left',
        [ToastPositions.RightBottom]: 'prefs_general_notify_position_bottom_right',
        [ToastPositions.LeftTop]: 'prefs_general_notify_position_top_left',
        [ToastPositions.RightTop]: 'prefs_general_notify_position_top_right',
    };
    return (
        <PreferenceBlock name="General">
            <ControlGroup w="100%">
                <LabeledControl isVertical messageId="prefs_general_click_icon_action">
                    <RadioGroupControl<Preferences> name="general.clickIconAction">
                        <RadioItem<ClickIconAction>
                            value={ClickIconActions.OpenAlbum}
                            messageId="prefs_general_click_icon_action_open_album" />
                        <RadioItem<ClickIconAction>
                            value={ClickIconActions.CaptureScreenshot}
                            messageId="prefs_general_click_icon_action_capture_screenshot" />
                    </RadioGroupControl>
                </LabeledControl>
            </ControlGroup>
            <Box w="100%">
                <ControlGroup isEnabledHover>
                    <LabeledControl messageId="prefs_general_notify_toast">
                        <SwitchControl<Preferences> name="general.notifyToast" />
                    </LabeledControl>
                </ControlGroup>
                <ControlGroup<Preferences> conditionKey="general.notifyToast" conditionValue={true}>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_general_notify_duration">
                            <NumberInputControl<Preferences>
                                name="general.notifyDuration"
                                w="10em"
                                min={100}
                                max={60000}
                                step={100}
                                precision={0}
                                unit="ms" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup indent="left">
                        <LabeledControl isVertical messageId="prefs_general_notify_position">
                            <RadioGroupControl<Preferences> w="100%" name="general.notifyPosition">
                                <HStack>
                                    {Object.values(ToastPositions).map(pos => (
                                        <RadioItem<ToastPosition>
                                            key={pos}
                                            value={pos}
                                            messageId={toastPositionItems[pos]} />
                                    ))}
                                </HStack>
                            </RadioGroupControl>
                        </LabeledControl>
                    </ControlGroup>
                </ControlGroup>
            </Box>
        </PreferenceBlock>
    );
};

export default GeneralPreferences;
