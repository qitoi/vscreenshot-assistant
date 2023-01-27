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

import { ScreenshotInfo, VideoInfo } from '../libs/types';
import * as platforms from '../platforms';
import * as storage from '../libs/storage';
import * as prefs from '../libs/prefs';
import * as popup from './popup-window';


const TWITTER_SHARE_URL = 'https://twitter.com/intent/tweet';

// twitter側のコンテンツスクリプトへのメッセージ送信待機設定
const SHARE_SCREENSHOT_MAX_TRIAL = 20;
const SHARE_SCREENSHOT_INTERVAL = 250;


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

    if (tweetPrefs.title) {
        text.push(video.title);
    }
    if (tweetPrefs.author) {
        text.push(video.author);
    }

    if (tweetPrefs.url) {
        options.url = platforms.getVideoUrl(video.platform, video.videoId);
    }
    if (text.length > 0) {
        options.text = text.join(' / ');
    }
    if (tweetPrefs.hashtag && hashtags.length > 0) {
        options.hashtags = hashtags.join(',');
    }

    const url = new URL(TWITTER_SHARE_URL);
    url.search = new URLSearchParams(options).toString();

    const popupWindow = popup.PopupWindow.create('twitter', url.toString(), false);
    const window = await popupWindow.show();
    if (window !== null) {
        // twitterのタブの読み込み完了を待ち、完了後にメッセージを送信
        const handler = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (changeInfo.status === 'complete') {
                chrome.tabs.get(tabId, tab => {
                    if (chrome.runtime.lastError) {
                        // エラーが出たら無視
                        return;
                    }
                    if (tab.windowId === window.id) {
                        chrome.tabs.onUpdated.removeListener(handler);
                        let trial = 0;
                        const trySend = () => {
                            chrome.tabs.sendMessage(tabId, { event: 'share-screenshot', images }, () => {
                                // firefoxでは他部の読み込みが完了したあともしばらくはコネクションが確立できずエラーになるため、成功するまでしばらく送信を繰り返す
                                if (chrome.runtime.lastError) {
                                    if (trial < SHARE_SCREENSHOT_MAX_TRIAL) {
                                        setTimeout(trySend, SHARE_SCREENSHOT_INTERVAL);
                                    }
                                }
                                trial += 1;
                            });
                        };
                        trySend();
                    }
                });
            }
        };
        chrome.tabs.onUpdated.addListener(handler);
    }
}
