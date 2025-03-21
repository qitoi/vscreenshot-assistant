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

import * as Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

import * as prefs from '../libs/prefs';


type ToastOption = Toastify.Options & {
    style?: Partial<CSSStyleDeclaration & { aspectRatio: string }>;
}

export type Toast = ReturnType<typeof Toastify> & {
    hideToast(): void;
}


let toasts: Toast[] = [];


export function showScreenshotToast(image: string, p: prefs.Preferences): void {
    for (const t of toasts) {
        t.hideToast();
    }
    toasts = [];

    const img = document.createElement('img') as HTMLImageElement;
    img.src = image;
    img.style['width'] = '100%';
    img.style['height'] = '100%';
    img.style['objectFit'] = 'contain';
    img.onload = () => {
        const div = document.createElement('div') as HTMLDivElement;
        div.style['width'] = '100%';
        div.style['height'] = '100%';
        div.appendChild(img);
        const toast = showToast({
            node: div,
            duration: p.general.notifyDuration,
            callback: () => {
                const idx = toasts.indexOf(toast);
                if (idx !== -1) {
                    toasts[idx].hideToast();
                    toasts.splice(idx, 1);
                }
            },
            style: {
                width: `${p.thumbnail.width}px`,
                aspectRatio: `${p.thumbnail.width} / ${p.thumbnail.height}`,
                padding: '8px',
                background: 'rgba(33, 33, 33, 0.94)',
            },
        }, p);
        toasts.push(toast);
    };
}

export function showToast(options: ToastOption, p: prefs.Preferences): Toast {
    options = {
        gravity: (p.general.notifyPosition === prefs.ToastPositions.LeftTop || p.general.notifyPosition === prefs.ToastPositions.RightTop) ? 'top' : 'bottom',
        position: (p.general.notifyPosition === prefs.ToastPositions.LeftTop || p.general.notifyPosition === prefs.ToastPositions.LeftBottom) ? 'left' : 'right',
        stopOnFocus: false,
        style: {
            color: 'rgba(220, 220, 220, 1)',
            borderRadius: '5px',
            fontSize: 'medium',
            lineHeight: '1.5em',
            padding: '8px',
            background: 'rgba(33, 33, 33, 0.94)',
        },
        ...options,
    };
    const toast = Toastify(options);
    toast.showToast();
    return toast as Toast;
}
