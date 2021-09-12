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

import { ScreenshotInfo } from '../types';
import * as storage from '../storage';

export const ScreenshotSortOrders = {
    CaptureDateDesc: 0,
    CaptureDateAsc: 1,
    VideoPosDesc: 2,
    VideoPosAsc: 3,
} as const;

export type ScreenshotSortOrder = typeof ScreenshotSortOrders[keyof typeof ScreenshotSortOrders];

export const DefaultSortOrder = ScreenshotSortOrders.CaptureDateDesc;


const ScreenshotSorter: { [key: string]: (a: ScreenshotInfo, b: ScreenshotInfo) => number } = {
    [ScreenshotSortOrders.CaptureDateDesc]: (a, b) => b.datetime - a.datetime,
    [ScreenshotSortOrders.CaptureDateAsc]: (a, b) => a.datetime - b.datetime,
    [ScreenshotSortOrders.VideoPosDesc]: (a, b) => b.pos - a.pos,
    [ScreenshotSortOrders.VideoPosAsc]: (a, b) => a.pos - b.pos,
};


const SCREENSHOT_SORT_ORDER_KEY = 'screenshot-sort-order';

export function loadScreenshotSortOrder(): Promise<ScreenshotSortOrder> {
    return storage.getItemById<ScreenshotSortOrder>(SCREENSHOT_SORT_ORDER_KEY, DefaultSortOrder);
}

export async function saveScreenshotSortOrder(order: ScreenshotSortOrder): Promise<void> {
    return storage.setItems({ [SCREENSHOT_SORT_ORDER_KEY]: +order });
}

export function sortScreenshot(screenshots: ScreenshotInfo[], order: ScreenshotSortOrder): ScreenshotInfo[] {
    return [...screenshots].sort(ScreenshotSorter[order]);
}
