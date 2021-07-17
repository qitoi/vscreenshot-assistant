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

import { ScreenshotInfo } from '../../../lib/types';

const ScreenshotSortOrder = {
    CaptureDateAsc: 0,
    CaptureDateDesc: 1,
    VideoPosAsc: 2,
    VideoPosDesc: 3,
} as const;

export type ScreenshotSortOrder = typeof ScreenshotSortOrder[keyof typeof ScreenshotSortOrder];

export const ScreenshotSortOrders = {
    [ScreenshotSortOrder.CaptureDateAsc]: '撮影日時 / 昇順',
    [ScreenshotSortOrder.CaptureDateDesc]: '撮影日時 / 降順',
    [ScreenshotSortOrder.VideoPosAsc]: '再生位置 / 昇順',
    [ScreenshotSortOrder.VideoPosDesc]: '再生位置 / 降順',
} as const;

const ScreenshotSorter: { [key: string]: (a: ScreenshotInfo, b: ScreenshotInfo) => number } = {
    [ScreenshotSortOrder.CaptureDateAsc]: (a, b) => a.datetime - b.datetime,
    [ScreenshotSortOrder.CaptureDateDesc]: (a, b) => b.datetime - a.datetime,
    [ScreenshotSortOrder.VideoPosAsc]: (a, b) => a.pos - b.pos,
    [ScreenshotSortOrder.VideoPosDesc]: (a, b) => b.pos - a.pos,
};


const SCREENSHOT_SORT_ORDER_KEY = 'screenshot:sort:order';

export function loadScreenshotSortOrder(): ScreenshotSortOrder {
    const order = localStorage.getItem(SCREENSHOT_SORT_ORDER_KEY);
    return (order !== null) ? +order as ScreenshotSortOrder : ScreenshotSortOrder.CaptureDateAsc;
}

export function saveScreenshotSortOrder(order: ScreenshotSortOrder) {
    localStorage.setItem(SCREENSHOT_SORT_ORDER_KEY, '' + order);
}

export function sortScreenshot(screenshots: ScreenshotInfo[], order: ScreenshotSortOrder): ScreenshotInfo[] {
    return [...screenshots].sort(ScreenshotSorter[order]);
}
