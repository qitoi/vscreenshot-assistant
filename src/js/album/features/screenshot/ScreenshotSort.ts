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

export const ScreenshotSortOrders = {
    CaptureDateAsc: 0,
    CaptureDateDesc: 1,
    VideoPosAsc: 2,
    VideoPosDesc: 3,
} as const;

export type ScreenshotSortOrder = typeof ScreenshotSortOrders[keyof typeof ScreenshotSortOrders];

const ScreenshotSorter: { [key: string]: (a: ScreenshotInfo, b: ScreenshotInfo) => number } = {
    [ScreenshotSortOrders.CaptureDateAsc]: (a, b) => a.datetime - b.datetime,
    [ScreenshotSortOrders.CaptureDateDesc]: (a, b) => b.datetime - a.datetime,
    [ScreenshotSortOrders.VideoPosAsc]: (a, b) => a.pos - b.pos,
    [ScreenshotSortOrders.VideoPosDesc]: (a, b) => b.pos - a.pos,
};


const SCREENSHOT_SORT_ORDER_KEY = 'screenshot:sort:order';

export function loadScreenshotSortOrder(): ScreenshotSortOrder {
    const order = localStorage.getItem(SCREENSHOT_SORT_ORDER_KEY);
    return (order !== null) ? +order as ScreenshotSortOrder : ScreenshotSortOrders.CaptureDateAsc;
}

export function saveScreenshotSortOrder(order: ScreenshotSortOrder): void {
    localStorage.setItem(SCREENSHOT_SORT_ORDER_KEY, '' + order);
}

export function sortScreenshot(screenshots: ScreenshotInfo[], order: ScreenshotSortOrder): ScreenshotInfo[] {
    return [...screenshots].sort(ScreenshotSorter[order]);
}
