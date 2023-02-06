/*
 *  Copyright 2023 qitoi
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
import { Plugin, PluginMethods } from 'yet-another-react-lightbox';
import { createModule, MODULE_CAROUSEL } from 'yet-another-react-lightbox/core';
import { InformationComponent } from './InformationComponent';

const PLUGIN_INFORMATION = 'information';

export const Information: Plugin = ({ addSibling }: PluginMethods) => {
    addSibling(MODULE_CAROUSEL, createModule(PLUGIN_INFORMATION, InformationComponent))
};
