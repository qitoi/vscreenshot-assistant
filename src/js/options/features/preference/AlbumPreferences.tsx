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

import { Preferences } from '../../../libs/prefs';
import ControlGroup from '../../components/ControlGroup';
import NumberInputControl from '../../components/NumberInputControl';
import LabeledControl from '../../components/LabeledControl';
import PreferenceBlock from './PreferenceBlock';
import SwitchControl from '../../components/SwitchControl';

const AlbumPreferences: React.FC = () => {
    return (
        <PreferenceBlock messageId="prefs_album">
            <ControlGroup isEnabledHover>
                <LabeledControl messageId="prefs_album_enable_virtual_scroll">
                    <SwitchControl<Preferences> name="album.enabledVirtualScroll" />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup>
                <LabeledControl messageId="prefs_album_files_per_archive">
                    <NumberInputControl<Preferences>
                        name="album.filesPerArchive"
                        w="10em"
                        min={100}
                        max={10000}
                        step={100}
                        precision={0} />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup label="prefs_thumbnail_size">
                <ControlGroup indent="left">
                    <LabeledControl messageId="prefs_thumbnail_width">
                        <NumberInputControl<Preferences>
                            name="thumbnail.width" w="10em" min={1} max={9999} step={1} precision={0} unit="px" />
                    </LabeledControl>
                </ControlGroup>
                <ControlGroup indent="left">
                    <LabeledControl messageId="prefs_thumbnail_height">
                        <NumberInputControl<Preferences>
                            name="thumbnail.height" w="10em" min={1} max={9999} step={1} precision={0} unit="px" />
                    </LabeledControl>
                </ControlGroup>
            </ControlGroup>
        </PreferenceBlock>
    );
};

export default AlbumPreferences;
