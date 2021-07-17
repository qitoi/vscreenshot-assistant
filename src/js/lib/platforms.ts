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

import Platform from './platforms/platform';
import Youtube from './platforms/youtube';

const platforms: { [key: string]: Platform } = {
    [Youtube.PLATFORM_ID]: Youtube,
};

export default {
    getVideoURL(platform: string, videoId: string): string {
        return platforms[platform]?.getVideoUrl(videoId);
    }
};
