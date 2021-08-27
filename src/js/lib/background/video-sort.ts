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

import { VideoInfo } from '../types';
import * as storage from '../storage';

export const VideoSortOrders = {
    LastUpdateDesc: 0,
    LastUpdateAsc: 1,
    VideoDateDesc: 2,
    VideoDateAsc: 3,
} as const;

export type VideoSortOrder = typeof VideoSortOrders[keyof typeof VideoSortOrders];

export const DefaultSortOrder = VideoSortOrders.LastUpdateDesc;


const VideoSorter: { [key: string]: (a: VideoInfo, b: VideoInfo) => number } = {
    [VideoSortOrders.LastUpdateDesc]: (a, b) => b.lastUpdated - a.lastUpdated,
    [VideoSortOrders.LastUpdateAsc]: (a, b) => a.lastUpdated - b.lastUpdated,
    [VideoSortOrders.VideoDateDesc]: (a, b) => b.date - a.date,
    [VideoSortOrders.VideoDateAsc]: (a, b) => a.date - b.date,
};


const VIDEO_SORT_ORDER_KEY = 'video-sort-order';

export async function loadVideoSortOrder(): Promise<VideoSortOrder> {
    const order = await storage.getItemById<VideoSortOrder>(VIDEO_SORT_ORDER_KEY);
    return order ?? DefaultSortOrder;
}

export function saveVideoSortOrder(order: VideoSortOrder): Promise<void> {
    return storage.setItems({ [VIDEO_SORT_ORDER_KEY]: +order });
}

export function sortVideo(videos: VideoInfo[], order: VideoSortOrder): VideoInfo[] {
    return [...videos].sort(VideoSorter[order]);
}
