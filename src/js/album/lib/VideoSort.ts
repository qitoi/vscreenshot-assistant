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

import { VideoInfo } from '../../lib/types';

const VideoSortOrder = {
    VideoDateAsc: 0,
    VideoDateDesc: 1,
    LastUpdateAsc: 2,
    LastUpdateDesc: 3,
} as const;

export type VideoSortOrder = typeof VideoSortOrder[keyof typeof VideoSortOrder];

export const VideoSortOrders = {
    [VideoSortOrder.VideoDateAsc]: '公開日 / 昇順',
    [VideoSortOrder.VideoDateDesc]: '公開日 / 降順',
    [VideoSortOrder.LastUpdateAsc]: '最終更新日時 / 昇順',
    [VideoSortOrder.LastUpdateDesc]: '最終更新日時 / 降順',
} as const;

const VideoSorter: { [key: string]: (a, b: VideoInfo) => number } = {
    [VideoSortOrder.VideoDateAsc]: (a, b: VideoInfo) => a.date - b.date,
    [VideoSortOrder.VideoDateDesc]: (a, b: VideoInfo) => b.date - a.date,
    [VideoSortOrder.LastUpdateAsc]: (a, b: VideoInfo) => a.lastUpdated - b.lastUpdated,
    [VideoSortOrder.LastUpdateDesc]: (a, b: VideoInfo) => b.lastUpdated - a.lastUpdated,
};


const VIDEO_SORT_ORDER_KEY = 'video:sort:order';

export function loadVideoSortOrder(): VideoSortOrder {
    const order = localStorage.getItem(VIDEO_SORT_ORDER_KEY);
    return (order !== null) ? +order as VideoSortOrder : VideoSortOrder.VideoDateAsc;
}

export function saveVideoSortOrder(order: VideoSortOrder) {
    localStorage.setItem(VIDEO_SORT_ORDER_KEY, '' + order);
}

export function sortVideo(videos: VideoInfo[], order: VideoSortOrder): VideoInfo[] {
    return [...videos].sort(VideoSorter[order]);
}
