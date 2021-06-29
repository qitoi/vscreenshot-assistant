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

import {
    ImageDataUrl,
    ScreenshotInfo,
} from '../../lib/types';
import * as storage from '../../lib-background/storage';

export function ShareScreenshot(platform, videoId: string, screenshots: ScreenshotInfo[]) {
    storage.getScreenshotList(screenshots).then(images => {
        shareScreenshotOnTwitter(platform, videoId, images);
    });
}

const TWITTER_SHARE_URL = 'https://twitter.com/intent/tweet';

function shareScreenshotOnTwitter(platform, videoId: string, screenshots: ImageDataUrl[]): void {
    let url = new URL(TWITTER_SHARE_URL);
    url.search = new URLSearchParams({
        url: `https://www.youtube.com/watch?v=${videoId}`,
    }).toString();

    chrome.windows.create({
        url: url.toString(),
        type: 'popup',
    }, window => {
        const handler = (tabId, changeInfo, tab) => {
            if (tabId == window.tabs[0].id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(handler);
                chrome.tabs.sendMessage(window.tabs[0].id, { event: 'share-screenshot', screenshots: screenshots });
            }
        };
        chrome.tabs.onUpdated.addListener(handler);
    });
}
