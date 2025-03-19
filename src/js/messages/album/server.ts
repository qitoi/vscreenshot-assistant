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


import * as storage from '../../libs/storage';
import * as prefs from '../../libs/prefs';
import * as popup from '../../background/popup-window';
import * as videoSort from '../../background/video-sort';
import * as screenshotSort from '../../background/screenshot-sort';
import { MessageServerBuilder } from '../server';


export function AlbumServer(server: MessageServerBuilder): void {
    server.handle('remove-video', async message => {
        await storage.removeVideoInfo(message.platform, message.videoId);
    });
    server.handle('remove-screenshot', async message => {
        await Promise.all(message.no.map(no => storage.removeScreenshotInfo(message.platform, message.videoId, no)));
    });
    server.handle('reset-storage', async () => {
        await clearAllScreenshot();
    });
}


async function clearAllScreenshot(): Promise<void> {
    // スクリーンショット以外の設定を退避
    const p = await prefs.loadPreferences();
    const windowSizeSet = await popup.loadWindowSizeSet();
    const videoSortOrder = await videoSort.loadVideoSortOrder();
    const screenshotSortOrder = await screenshotSort.loadScreenshotSortOrder();

    await storage.clearAll();

    // 復元
    await prefs.savePreferences(p);
    await popup.saveWindowSizeSet(windowSizeSet);
    await videoSort.saveVideoSortOrder(videoSortOrder);
    await screenshotSort.saveScreenshotSortOrder(screenshotSortOrder);
}
