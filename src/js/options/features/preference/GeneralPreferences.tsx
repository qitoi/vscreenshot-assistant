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
import { PreferenceBlock } from './PreferenceBlock';
import { SwitchControl } from './SwitchControl';
import { PreferenceControl } from './PreferenceControl';
import { HotkeyInputControl } from './HotkeyInputControl';

export function GeneralPreferences() {
    return (
        <PreferenceBlock name="General">
            <PreferenceControl<Preferences> name="general.captureHotkey" label="スクリーンショット撮影のキー設定">
                <HotkeyInputControl<Preferences> name="general.captureHotkey" w="12em" />
            </PreferenceControl>
            <PreferenceControl<Preferences> name="general.copyClipboard" label="スクリーンショットをクリップボードにコピーする">
                <SwitchControl<Preferences> name="general.copyClipboard" />
            </PreferenceControl>
        </PreferenceBlock>
    );
}
