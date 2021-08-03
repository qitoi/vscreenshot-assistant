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
import { Text } from '@chakra-ui/react';

import { FileType, Preferences } from '../../../lib/prefs';
import { LocalizedText } from '../../../lib/components/LocalizedText';
import PreferenceBlock from './PreferenceBlock';
import ControlGroup from './ControlGroup';
import RadioItem from './RadioItem';
import NumberInputControl from './NumberInputControl';
import LabeledControl from './LabeledControl';
import RadioGroupControl from './RadioGroupControl';

const ScreenshotPreferences: React.FC = () => {
    return (
        <PreferenceBlock name="Screenshot">
            <ControlGroup w="100%">
                <LabeledControl isVertical label={<LocalizedText messageId="prefsScreenshotFormat" />}>
                    <RadioGroupControl<Preferences> name="screenshot.fileType">
                        <RadioItem<FileType> value="image/jpeg" label={<LocalizedText messageId="prefsScreenshotFormatJPEG" />}>
                            <ControlGroup<Preferences> conditionKey="screenshot.fileType" conditionValue="image/jpeg">
                                <LabeledControl label={<LocalizedText messageId="prefsScreenshotFormatJPEGQuality" />}>
                                    <NumberInputControl<Preferences>
                                        name="screenshot.quality"
                                        w="12em"
                                        min={0}
                                        max={100}
                                        step={1}
                                        precision={0} />
                                </LabeledControl>
                            </ControlGroup>
                        </RadioItem>
                        <RadioItem<FileType> value="image/png" label={<LocalizedText messageId="prefsScreenshotFormatPNG" />} />
                    </RadioGroupControl>
                </LabeledControl>
            </ControlGroup>
        </PreferenceBlock>
    );
};

export default ScreenshotPreferences;
