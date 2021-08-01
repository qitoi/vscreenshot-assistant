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

import { Preferences } from '../../../lib/prefs';
import { LocalizedText } from '../../../lib/components/LocalizedText';
import { PreferenceBlock } from './PreferenceBlock';
import { PreferenceControl } from './PreferenceControl';
import { NumberInputControl } from './NumberInputControl';

export function ThumbnailPreferences() {
    return (
        <PreferenceBlock name="Thumbnail">
            <PreferenceControl<Preferences> name="thumbnail.width" label={<LocalizedText messageId="prefsThumbnailWidth" />}>
                <NumberInputControl<Preferences> name="thumbnail.width" w="12em" min={1} step={1} precision={0} />
            </PreferenceControl>
            <PreferenceControl<Preferences> name="thumbnail.height" label={<LocalizedText messageId="prefsThumbnailHeight" />}>
                <NumberInputControl<Preferences> name="thumbnail.height" w="12em" min={1} step={1} precision={0} />
            </PreferenceControl>
        </PreferenceBlock>
    );
}
