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
import PreferenceBlock from './PreferenceBlock';
import SwitchControl from './SwitchControl';
import ControlGroup from './ControlGroup';
import LabeledControl from './LabeledControl';

const TweetPreferences: React.FC = () => {
    return (
        <PreferenceBlock name="Tweet">
            <ControlGroup isEnabledHover>
                <LabeledControl label={<LocalizedText messageId="prefsTweetURL" />}>
                    <SwitchControl<Preferences> name="tweet.tweetUrl" />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup isEnabledHover>
                <LabeledControl label={<LocalizedText messageId="prefsTweetTitle" />}>
                    <SwitchControl<Preferences> name="tweet.tweetTitle" />
                </LabeledControl>
            </ControlGroup>
            <ControlGroup isEnabledHover>
                <LabeledControl label={<LocalizedText messageId="prefsTweetAuthor" />}>
                    <SwitchControl<Preferences> name="tweet.tweetAuthor" />
                </LabeledControl>
            </ControlGroup>
        </PreferenceBlock>
    );
};

export default TweetPreferences;
