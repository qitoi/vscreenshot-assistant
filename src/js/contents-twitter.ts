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

import { ImageDataUrl } from './lib/types';
import { convertScreenshotToFile } from './lib/data-url';

chrome.runtime.onMessage.addListener(message => {
    switch (message.event) {
        case 'share-screenshot': {
            pasteScreenshot(message.screenshots);
            break;
        }
    }
});

function pasteScreenshot(screenshots: ImageDataUrl[]): void {
    const files = screenshots.map(s => convertScreenshotToFile(s));
    const id = setInterval(() => {
        const dropArea = document.querySelector('div.public-DraftEditor-content');
        if (dropArea !== null) {
            clearInterval(id);

            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('js/inject-twitter.js');
            script.onload = () => {
                document.dispatchEvent(new CustomEvent('paste-screenshot', { detail: files }));
                script.remove();
            };
            (document.head || document.documentElement).appendChild(script);
        }
    }, 500);
}
