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

import { Preferences } from '../../../lib/prefs';
import PreferenceBlock from './PreferenceBlock';
import ControlGroup from './ControlGroup';
import NumberInputControl from './NumberInputControl';
import LabeledControl from './LabeledControl';
import SwitchControl from './SwitchControl';
import HotkeyInputControl from './HotkeyInputControl';

const AnimationPreferences: React.FC = () => {
    return (
        <PreferenceBlock name="Animation">
            <Box w="100%">
                <ControlGroup isEnabledHover>
                    <LabeledControl messageId="prefs_animation_enabled">
                        <SwitchControl<Preferences> name="animation.enabled" />
                    </LabeledControl>
                </ControlGroup>
                <ControlGroup<Preferences> conditionKey="animation.enabled" conditionValue={true} hideIfDisabled>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_animation_hotkey">
                            <HotkeyInputControl<Preferences> name="animation.captureHotkey" w="12em" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_animation_width">
                            <NumberInputControl<Preferences> name="animation.width"
                                                             w="10em"
                                                             min={1}
                                                             max={9999}
                                                             step={1}
                                                             precision={0}
                                                             unit="px" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_animation_height">
                            <NumberInputControl<Preferences> name="animation.height"
                                                             w="10em"
                                                             min={1}
                                                             max={9999}
                                                             step={1}
                                                             precision={0}
                                                             unit="px" />
                        </LabeledControl>
                    </ControlGroup>
                    <ControlGroup indent="left">
                        <LabeledControl messageId="prefs_animation_interval">
                            <NumberInputControl<Preferences> name="animation.interval"
                                                             w="10em"
                                                             min={10}
                                                             max={9999}
                                                             step={10}
                                                             precision={0}
                                                             unit="ms" />
                        </LabeledControl>
                    </ControlGroup>
                </ControlGroup>
            </Box>
        </PreferenceBlock>
    );
};

export default AnimationPreferences;
