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
import { NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper } from '@chakra-ui/react';
import { useController, useFormContext } from 'react-hook-form';

import { Preferences } from '../../../lib/prefs';
import { PreferenceBlock } from './PreferenceBlock';
import { PreferenceControl } from './PreferenceControl';

export function ThumbnailPreferences() {
    const { control } = useFormContext<Preferences>();
    const { field: widthField } = useController({ name: 'thumbnail.width', control });
    const { field: heightField } = useController({ name: 'thumbnail.height', control });
    return (
        <PreferenceBlock name="Thumbnail">
            <PreferenceControl<Preferences> name="thumbnail.width" label="width">
                <NumberInput id="thumbnail.width" min={1} step={1} precision={0} {...widthField}>
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </PreferenceControl>
            <PreferenceControl<Preferences> name="thumbnail.height" label="height">
                <NumberInput id="thumbnail.height" min={1} step={1} precision={0} {...heightField}>
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </PreferenceControl>
        </PreferenceBlock>
    );
}
