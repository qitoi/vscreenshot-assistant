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

import { createAsyncThunk, createSlice, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';

import { compareVideoInfo, ImageDataUrl, ScreenshotInfo, VideoInfoKey } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import * as screenshotSort from '../../../lib/background/screenshot-sort';
import { RootState } from '../../store';
import { setActiveVideo } from '../activeVideo/activeVideoSlice';


type ScreenshotState = {
    order: screenshotSort.ScreenshotSortOrder | null,
    videoInfoKey: VideoInfoKey | null,
    screenshots: ScreenshotInfo[],
    screenshotMap: { [no: number]: ScreenshotInfo },
    thumbnails: { [no: number]: ImageDataUrl },
};

const initialState: ScreenshotState = {
    order: null,
    videoInfoKey: null,
    screenshots: [],
    screenshotMap: {},
    thumbnails: {},
};

type AppendScreenshotPayload = {
    platform: string,
    videoId: string,
    target: ScreenshotInfo,
    thumbnail: ImageDataUrl,
};
type RemoveScreenshotPayload = {
    platform: string,
    videoId: string,
    target: ScreenshotInfo,
};
type FetchScreenshotListPayload = {
    platform: string,
    videoId: string,
    screenshots: ScreenshotInfo[],
}
type FetchSortOrderPayload = {
    order: screenshotSort.ScreenshotSortOrder,
};
type SetSortOrderPayload = {
    order: screenshotSort.ScreenshotSortOrder,
};


export const fetchScreenshotList = createAsyncThunk<FetchScreenshotListPayload, { platform: string, videoId: string }>(
    'screenshot/fetchScreenshotList',
    async ({ platform, videoId }): Promise<FetchScreenshotListPayload> => {
        const screenshots = await storage.getScreenshotInfoList(platform, videoId);
        return {
            platform,
            videoId,
            screenshots,
        };
    }
);

export const fetchScreenshotSortOrder = createAsyncThunk<FetchSortOrderPayload, void>(
    'screenshot/fetchScreenshotSortOrder',
    async (): Promise<FetchSortOrderPayload> => {
        const order = await screenshotSort.loadScreenshotSortOrder();
        return {
            order,
        };
    }
);

export const setScreenshotSortOrder = createAsyncThunk<FetchSortOrderPayload, SetSortOrderPayload>(
    'screenshot/setScreenshotSortOrder',
    async ({ order }): Promise<FetchSortOrderPayload> => {
        await screenshotSort.saveScreenshotSortOrder(order);
        return {
            order,
        };
    }
);


const slice = createSlice<ScreenshotState, SliceCaseReducers<ScreenshotState>>({
    name: 'screenshot',
    initialState,
    reducers: {
        appendScreenshot: (state, action: PayloadAction<AppendScreenshotPayload>): void => {
            const p = action.payload;
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, p)) {
                state.screenshotMap[p.target.no] = p.target;
                state.screenshots = screenshotSort.sortScreenshot(Object.values(state.screenshotMap), state.order ?? screenshotSort.DefaultSortOrder);
                state.thumbnails[p.target.no] = p.thumbnail;
            }
        },
        removeScreenshot: (state, action: PayloadAction<RemoveScreenshotPayload>): void => {
            const p = action.payload;
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, p)) {
                delete state.screenshotMap[p.target.no];
                state.screenshots = screenshotSort.sortScreenshot(Object.values(state.screenshotMap), state.order ?? screenshotSort.DefaultSortOrder);
            }
        },
        removeThumbnail: (state, action) => {
            const p = action.payload;
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, p)) {
                delete state.thumbnails[p.no];
            }
        },
    },
    extraReducers: builder => {
        builder.addCase(setActiveVideo.fulfilled, (state, action): void => {
            const video = action.payload.video;
            if (state.videoInfoKey === null || video === null || !compareVideoInfo(state.videoInfoKey, video)) {
                state.videoInfoKey = (video === null ? null : { platform: video.platform, videoId: video.videoId });
                state.screenshots = [];
                state.screenshotMap = {};
                state.thumbnails = {};
            }
        });
        builder.addCase(fetchScreenshotList.fulfilled, (state, action) => {
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, action.payload)) {
                state.screenshotMap = {};
                for (const s of action.payload.screenshots) {
                    state.screenshotMap[s.no] = s;
                }
                state.screenshots = screenshotSort.sortScreenshot(action.payload.screenshots, state.order ?? screenshotSort.DefaultSortOrder);
                state.thumbnails = {};
            }
        });
        builder.addCase(fetchScreenshotSortOrder.fulfilled, (state, action) => {
            state.screenshots = screenshotSort.sortScreenshot(state.screenshots, action.payload.order);
            state.order = action.payload.order;
        });
        builder.addCase(setScreenshotSortOrder.fulfilled, (state, action) => {
            state.screenshots = screenshotSort.sortScreenshot(state.screenshots, action.payload.order);
            state.order = action.payload.order;
        });
    },
});

export default slice.reducer;
export const { appendScreenshot, removeThumbnail } = slice.actions;

export const selectScreenshotList = (state: RootState, platform: string, videoId: string): typeof state.screenshot.screenshots => {
    if (state.screenshot.videoInfoKey !== null && compareVideoInfo(state.screenshot.videoInfoKey, { platform, videoId })) {
        return state.screenshot.screenshots;
    }
    return [];
};
export const selectScreenshotSortOrder = (state: RootState): typeof state.screenshot.order => state.screenshot.order;
export const selectCachedThumbnail = (state: RootState, platform: string, videoId: string, no: number): ImageDataUrl | null => {
    if (state.screenshot.videoInfoKey !== null && compareVideoInfo(state.screenshot.videoInfoKey, { platform, videoId })) {
        return state.screenshot.thumbnails[no] ?? null;
    }
    return null;
};
