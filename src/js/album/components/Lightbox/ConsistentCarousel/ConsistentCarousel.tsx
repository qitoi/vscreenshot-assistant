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

import { Plugin, PluginMethods } from 'yet-another-react-lightbox';
import { createModule, MODULE_CAROUSEL } from 'yet-another-react-lightbox/core';

import { PLUGIN_CONSISTENT_CAROUSEL } from './index';
import { ConsistentCarouselComponent } from './ConsistentCarouselComponent';

export const ConsistentCarousel: Plugin = ({ replace }: PluginMethods) => {
    replace(MODULE_CAROUSEL, createModule(PLUGIN_CONSISTENT_CAROUSEL, ConsistentCarouselComponent));
};
