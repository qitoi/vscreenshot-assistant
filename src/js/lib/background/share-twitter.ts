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

import { ScreenshotInfo, VideoInfo } from '../types';
import * as platforms from '../platforms';
import * as storage from '../storage';
import * as prefs from '../prefs';
import * as popup from './popup-window';


const TWITTER_SHARE_URL = 'https://twitter.com/intent/tweet';

type TweetOptions = {
    url?: string,
    text?: string,
    hashtags?: string,
};


export async function shareScreenshot(video: VideoInfo, screenshots: ScreenshotInfo[], hashtags: string[]): Promise<void> {
    const images = await storage.getScreenshotList(screenshots);

    const options: TweetOptions = {};
    const text: string[] = [];

    const tweetPrefs = (await prefs.loadPreferences()).tweet;

    if (tweetPrefs.tweetTitle) {
        text.push(video.title);
    }
    if (tweetPrefs.tweetAuthor) {
        text.push(video.author);
    }

    if (tweetPrefs.tweetUrl) {
        options.url = platforms.getVideoUrl(video.platform, video.videoId);
    }
    if (text.length > 0) {
        options.text = text.join(' / ');
    }
    if (tweetPrefs.tweetHashtag && hashtags.length > 0) {
        options.hashtags = hashtags.join(',');
    }

    const url = new URL(TWITTER_SHARE_URL);
    url.search = new URLSearchParams(options).toString();

    const popupWindow = popup.PopupWindow.create('twitter', url.toString(), false);
    await popupWindow.show();

    const window = popupWindow.getWindow();
    if (window !== null) {
        const handler = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (window.tabs !== undefined && window.tabs.length > 0) {
                if (tabId == window.tabs[0].id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(handler);
                    chrome.tabs.sendMessage(window.tabs[0].id, { event: 'share-screenshot', images });
                }
            }
        };
        chrome.tabs.onUpdated.addListener(handler);
    }
}
