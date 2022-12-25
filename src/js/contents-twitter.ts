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

import { ImageDataUrl } from './libs/types';
import { convertScreenshotToFile } from './libs/data-url';
import * as twitterMessage from './libs/twitter-message';
import { listenOnce } from './libs/event-listen';


// twitterのファイルドロップ先の生成待機設定
const DROP_FILES_TRIAL = 20;
const DROP_FILES_INTERVAL = 500;


listenOnce(chrome.runtime.onMessage, (message, sender, sendResponse) => {
    // backgroundからのスクリーンショット受信
    switch (message.event) {
        case 'share-screenshot': {
            pasteScreenshot(message.images);
            sendResponse();
            break;
        }
    }
});


function pasteScreenshot(images: ImageDataUrl[]): void {
    const files = images.map(s => convertScreenshotToFile(s));

    let trial = 0;
    const tryDrop = () => {
        // ファイルのドロップ先が見つかるまで待機
        const dropArea = document.querySelector('div.public-DraftEditor-content');
        if (dropArea === null) {
            if (trial < DROP_FILES_TRIAL) {
                setTimeout(tryDrop, DROP_FILES_INTERVAL);
            }
            trial += 1;
            return;
        }

        // ページコンテキストで動作できるようにスクリプトを注入する
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('js/inject-twitter.js');
        script.onload = () => {
            // スクリプトのロードが完了すれば、ページコンテキストにファイルを送る
            twitterMessage.sendFiles(files);
            script.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    };

    tryDrop();
}
