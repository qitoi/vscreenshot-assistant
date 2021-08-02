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
import { HStack } from '@chakra-ui/react';

import { Preferences, ToastPosition, ToastPositions } from '../../../lib/prefs';
import { LocalizedText, MessageId } from '../../../lib/components/LocalizedText';
import PreferenceBlock from './PreferenceBlock';
import SwitchControl from './SwitchControl';
import ControlGroup from './ControlGroup';
import HotkeyInputControl from './HotkeyInputControl';
import LabeledControl from './LabeledControl';
import RadioItem from './RadioItem';
import RadioGroupControl from './RadioGroupControl';
import NumberInputControl from './NumberInputControl';

const GeneralPreferences: React.FC = () => {
    const toastPositionItems: Record<ToastPosition, MessageId> = {
        [ToastPositions.LeftBottom]: 'prefsGeneralNotifyPositionBottomLeft',
        [ToastPositions.RightBottom]: 'prefsGeneralNotifyPositionBottomRight',
        [ToastPositions.LeftTop]: 'prefsGeneralNotifyPositionTopLeft',
        [ToastPositions.RightTop]: 'prefsGeneralNotifyPositionTopRight',
    };
    return (
        <PreferenceBlock name="General">
            <ControlGroup>
                <LabeledControl label={<LocalizedText messageId="prefsGeneralHotkey" />}>
                    <HotkeyInputControl<Preferences> name="general.captureHotkey" w="12em" />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup isEnabledHover>
                <LabeledControl label={<LocalizedText messageId="prefsGeneralClipboardCopy" />}>
                    <SwitchControl<Preferences> name="general.copyClipboard" />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup>
                <LabeledControl label={<LocalizedText messageId="prefsGeneralNotifyToast" />}>
                    <SwitchControl<Preferences> name="general.notifyToast" />
                </LabeledControl>
                <ControlGroup<Preferences> conditionKey="general.notifyToast" conditionValue={true}>
                    <ControlGroup>
                        <LabeledControl label={<LocalizedText messageId="prefsGeneralNotifyDuration" />}>
                            <NumberInputControl<Preferences>
                                name="general.notifyDuration"
                                w="12em"
                                min={100}
                                max={60000}
                                step={100}
                                precision={0}
                                unit="ms" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup>
                        <LabeledControl isVertical label={<LocalizedText messageId="prefsGeneralNotifyPosition" />}>
                            <RadioGroupControl<Preferences> w="100%" name="general.notifyPosition">
                                <HStack>
                                    {Object.values(ToastPositions).map(pos => (
                                        <RadioItem<ToastPosition>
                                            key={pos}
                                            value={pos}
                                            label={<LocalizedText messageId={toastPositionItems[pos]} />} />
                                    ))}
                                </HStack>
                            </RadioGroupControl>
                        </LabeledControl>
                    </ControlGroup>
                </ControlGroup>
            </ControlGroup>
        </PreferenceBlock>
    );
};

export default GeneralPreferences;
