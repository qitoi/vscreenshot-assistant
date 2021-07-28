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
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    RadioGroup,
    Spacer
} from '@chakra-ui/react';
import { useController, useFormContext } from 'react-hook-form';

import * as prefs from '../../../lib/prefs';
import { PreferenceBlock } from './PreferenceBlock';
import { PreferenceControl } from './PreferenceControl';
import { RadioItem } from './RadioItem';

export function ScreenshotPreferences() {
    const { control, watch } = useFormContext<prefs.Preferences>();
    const { field: fileTypeField } = useController({ name: 'screenshot.fileType', control });
    const { field: fileQualityField } = useController({ name: 'screenshot.quality', control });
    const fileType = watch('screenshot.fileType');
    return (
        <PreferenceBlock name="Screenshot">
            <PreferenceControl<prefs.Preferences> name="screenshot.fileType" w="100%" isFitted>
                <RadioGroup w="100%" {...fileTypeField}>
                    <RadioItem<prefs.FileType> value="image/jpeg" label="JPEG">
                        <Spacer />
                        <PreferenceControl<prefs.Preferences>
                            name="screenshot.quality"
                            label="quality"
                            isFitted
                            isDisabled={fileType !== 'image/jpeg'}>
                            <NumberInput id="screenshot.quality" inputMode="numeric" min={0} max={1} step={0.01} {...fileQualityField}>
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </PreferenceControl>
                    </RadioItem>
                    <RadioItem<prefs.FileType> value="image/png" label="PNG" />
                </RadioGroup>
            </PreferenceControl>
        </PreferenceBlock>
    );
}
