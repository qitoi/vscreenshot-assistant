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
import * as storage from '../../../lib/background/storage';
import { RootState } from '../../store';
import { loadScreenshotSortOrder, saveScreenshotSortOrder, sortScreenshot, ScreenshotSortOrder } from './ScreenshotSort';
import { setActiveVideo, SetActiveVideoPayload } from '../activeVideo/activeVideoSlice';


type ScreenshotState = {
    order: ScreenshotSortOrder,
    videoInfoKey: VideoInfoKey | null,
    screenshots: ScreenshotInfo[],
    screenshotMap: { [no: number]: ScreenshotInfo },
    thumbnails: { [no: number]: ImageDataUrl },
};

const initialState: ScreenshotState = {
    order: loadScreenshotSortOrder(),
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
type SetSortOrderPayload = {
    order: ScreenshotSortOrder,
};
type FetchScreenshotListPayload = {
    platform: string,
    videoId: string,
    screenshots: ScreenshotInfo[],
}


export const fetchScreenshotList = createAsyncThunk<FetchScreenshotListPayload, { platform: string, videoId: string }>
(
    'screenshot/fetchScreenshotList',
    async ({ platform, videoId }, thunkAPI): Promise<FetchScreenshotListPayload> => {
        const screenshots = await storage.getScreenshotInfoList(platform, videoId);
        return {
            platform,
            videoId,
            screenshots,
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
                state.screenshots = sortScreenshot(Object.values(state.screenshotMap), state.order);
                state.thumbnails[p.target.no] = p.thumbnail;
            }
        },
        removeScreenshot: (state, action: PayloadAction<RemoveScreenshotPayload>): void => {
            const p = action.payload;
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, p)) {
                delete state.screenshotMap[p.target.no];
                state.screenshots = sortScreenshot(Object.values(state.screenshotMap), state.order);
            }
        },
        setSortOrder: (state, action: PayloadAction<SetSortOrderPayload>): void => {
            const p = action.payload;
            saveScreenshotSortOrder(p.order);
            state.screenshots = sortScreenshot(state.screenshots, p.order);
            state.order = p.order;
        },
        removeThumbnail: (state, action) => {
            const p = action.payload;
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, p)) {
                delete state.thumbnails[p.no];
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(setActiveVideo, (state, action: PayloadAction<SetActiveVideoPayload>): void => {
                const p = action.payload;
                if (state.videoInfoKey === null || p === null || !compareVideoInfo(state.videoInfoKey, p)) {
                    state.videoInfoKey = (p === null ? null : { platform: p.platform, videoId: p.videoId });
                    state.screenshots = [];
                    state.screenshotMap = {};
                    state.thumbnails = {};
                }
            })
            .addCase(fetchScreenshotList.fulfilled, (state, action) => {
                if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, action.payload)) {
                    state.screenshotMap = {};
                    for (const s of action.payload.screenshots) {
                        state.screenshotMap[s.no] = s;
                    }
                    state.screenshots = sortScreenshot(action.payload.screenshots, state.order);
                    state.thumbnails = {};
                }
            })
        ;
    },
});

export default slice.reducer;
export const { appendScreenshot, removeScreenshot, setSortOrder, removeThumbnail } = slice.actions;

export const selectScreenshotList = (state: RootState, platform: string, videoId: string) => {
    if (state.screenshot.videoInfoKey !== null && compareVideoInfo(state.screenshot.videoInfoKey, { platform, videoId })) {
        return state.screenshot.screenshots;
    }
    return [];
};
export const selectScreenshotSortOrder = (state: RootState) => state.screenshot.order;
export const selectCachedThumbnail = (state: RootState, platform: string, videoId: string, no: number): ImageDataUrl | null => {
    if (state.screenshot.videoInfoKey !== null && compareVideoInfo(state.screenshot.videoInfoKey, { platform, videoId })) {
        return state.screenshot.thumbnails[no] ?? null;
    }
    return null;
};
