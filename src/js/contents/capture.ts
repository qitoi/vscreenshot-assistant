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


import { ImageDataUrl } from '../libs/types';
import * as prefs from '../libs/prefs';
import * as hotkeys from '../libs/hotkeys';
import { Platform } from '../platforms/platform';
import { MessageServer } from "../messages/server";
import * as screenshot from './screenshot';
import * as animation from './animation';
import { showScreenshotToast } from './toast';


export function Setup(platform: Platform): void {
    prefs.watch().addListener(prefs => {
        setupCaptureHotkey(platform, prefs);
    });
    prefs.loadPreferences().then(prefs => {
        setupCaptureHotkey(platform, prefs);
    });

    new MessageServer()
        .handle('tab-capture-request', async () => {
            if (platform.checkVideoPage()) {
                const p = await prefs.loadPreferences();
                const complete = screenshot.capture(platform, p);
                captureComplete(complete, p);
            }
        })
        .listen();
}

const unbinder: (() => void)[] = [];

function setupCaptureHotkey(platform: Platform, prefs: prefs.Preferences) {
    for (const unbind of unbinder) {
        unbind();
    }
    unbinder.splice(0);

    unbinder.push(
        hotkeys.bindHotkey(window, prefs.screenshot.hotkey, () => {
            if (platform.checkVideoPage()) {
                const complete = screenshot.capture(platform, prefs);
                captureComplete(complete, prefs);
            }
        })
    );

    if (prefs.screenshot.enabledContinuous) {
        unbinder.push(
            hotkeys.bindHotkey(window, prefs.screenshot.continuousHotkey, onKeyUp => {
                const capture = () => {
                    const complete = screenshot.capture(platform, prefs);
                    captureComplete(complete, prefs);
                };
                capture();
                const id = setInterval(capture, prefs.screenshot.continuousInterval);
                const stop = wrapStopOnBlur(onKeyUp);
                stop.then(() => {
                    clearInterval(id);
                });
            })
        );
    }

    if (prefs.animation.enabled) {
        unbinder.push(
            hotkeys.bindHotkey(window, prefs.animation.hotkey, onKeyUp => {
                if (platform.checkVideoPage()) {
                    const stop = wrapStopOnBlur(onKeyUp);
                    const complete = animation.capture(platform, stop, prefs);
                    captureComplete(complete, prefs);
                }
            })
        );
    }
}


function wrapStopOnBlur(onKeyUp: Promise<void>): Promise<void> {
    // ブラウザからフォーカスが外れたら停止させる
    let handleBlur: (() => void) | null = null;
    const onBlur = new Promise<void>(resolve => {
        handleBlur = resolve;
        window.addEventListener('blur', handleBlur, { once: true });
    });
    return Promise.race([onKeyUp, onBlur]).then(() => {
        if (handleBlur !== null) {
            window.removeEventListener('blur', handleBlur);
        }
    });
}


function captureComplete(capture: Promise<ImageDataUrl>, prefs: prefs.Preferences) {
    capture
        .then(image => {
            if (prefs.general.notify) {
                showScreenshotToast(image, prefs);
            }
        })
        .catch(() => null);
}
