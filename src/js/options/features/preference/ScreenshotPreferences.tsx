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
import { Box } from '@chakra-ui/react';

import { FileType, Preferences } from '../../../libs/prefs';
import ControlGroup from '../../components/ControlGroup';
import RadioItem from '../../components/RadioItem';
import NumberInputControl from '../../components/NumberInputControl';
import LabeledControl from '../../components/LabeledControl';
import RadioGroupControl from '../../components/RadioGroupControl';
import HotkeyInputControl from '../../components/HotkeyInputControl';
import SwitchControl from '../../components/SwitchControl';
import PreferenceBlock from './PreferenceBlock';

const ScreenshotPreferences: React.FC = () => {
    return (
        <PreferenceBlock messageId="prefs_screenshot">
            <ControlGroup>
                <LabeledControl messageId="prefs_screenshot_hotkey">
                    <HotkeyInputControl<Preferences> name="screenshot.hotkey" w="12em" />
                </LabeledControl>
            </ControlGroup>
            <Box w="100%">
                <ControlGroup isEnabledHover>
                    <LabeledControl messageId="prefs_screenshot_enabled_continuous_capture">
                        <SwitchControl<Preferences> name="screenshot.enabledContinuous" />
                    </LabeledControl>
                </ControlGroup>
                <ControlGroup<Preferences> conditionKey="screenshot.enabledContinuous" conditionValue={true}>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_screenshot_continuous_capture_hotkey">
                            <HotkeyInputControl<Preferences> name="screenshot.continuousHotkey" w="12em" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_screenshot_continuous_capture_interval">
                            <NumberInputControl<Preferences>
                                name="screenshot.continuousInterval" w="10em" min={10} max={10000} step={10} precision={0} unit="ms" />
                        </LabeledControl>
                    </ControlGroup>
                </ControlGroup>
            </Box>
            <ControlGroup w="100%">
                <LabeledControl isVertical messageId="prefs_screenshot_format">
                    <RadioGroupControl<Preferences> name="screenshot.fileType">
                        <RadioItem<FileType> value="image/jpeg" messageId="prefs_screenshot_format_jpeg">
                            <ControlGroup<Preferences> conditionKey="screenshot.fileType" conditionValue="image/jpeg">
                                <LabeledControl messageId="prefs_screenshot_format_jpeg_quality">
                                    <NumberInputControl<Preferences>
                                        name="screenshot.quality" w="12em" min={0} max={100} step={1} precision={0} />
                                </LabeledControl>
                            </ControlGroup>
                        </RadioItem>
                        <RadioItem<FileType> value="image/png" messageId="prefs_screenshot_format_png" />
                    </RadioGroupControl>
                </LabeledControl>
            </ControlGroup>
            <ControlGroup isEnabledHover conditionKey="screenshot.fileType" conditionValue="image/png">
                <LabeledControl messageId="prefs_screenshot_enabled_save_to_clipboard">
                    <SwitchControl<Preferences> name="screenshot.enabledSaveToClipboard" />
                </LabeledControl>
            </ControlGroup>
        </PreferenceBlock>
    );
};

export default ScreenshotPreferences;
