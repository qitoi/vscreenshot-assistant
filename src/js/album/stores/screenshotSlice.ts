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

import { compareVideoInfo, getScreenshotKey, ImageDataUrl, ScreenshotInfo } from '../../lib/types';
import { RootState } from './store';
import {
    loadScreenshotSortOrder,
    saveScreenshotSortOrder,
    sortScreenshot,
    ScreenshotSortOrder
} from '../lib/ScreenshotSort';
import { setActiveVideo, SetActiveVideoPayload } from './activeVideoAction';
import * as storage from '../../lib/background/storage';


type ScreenshotState = {
    order: ScreenshotSortOrder,
    platform: string,
    videoId: string,
    screenshots: ScreenshotInfo[],
    screenshotMap: { [no: number]: ScreenshotInfo },
    thumbnails: { [no: number]: ImageDataUrl },
};

const initialState: ScreenshotState = {
    order: loadScreenshotSortOrder(),
    platform: null,
    videoId: null,
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
            if (state.platform === p.platform && state.videoId === p.videoId) {
                state.screenshotMap[p.target.no] = p.target;
                state.screenshots = sortScreenshot(Object.values(state.screenshotMap), state.order);
                state.thumbnails[p.target.no] = p.thumbnail;
            }
        },
        removeScreenshot: (state, action: PayloadAction<RemoveScreenshotPayload>): void => {
            const p = action.payload;
            if (state.platform === p.platform && state.videoId === p.videoId) {
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
            if (state.platform === action.payload.platform && state.videoId === action.payload.videoId) {
                delete state.thumbnails[action.payload.no];
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(setActiveVideo, (state, action: PayloadAction<SetActiveVideoPayload>): void => {
                if (action.payload === null || !compareVideoInfo(state, action.payload)) {
                    state.platform = action.payload?.platform ?? null;
                    state.videoId = action.payload?.videoId ?? null;
                    state.screenshots = [];
                    state.screenshotMap = {};
                    state.thumbnails = {};
                }
            })
            .addCase(fetchScreenshotList.fulfilled, (state, action) => {
                if (compareVideoInfo(state, action.payload)) {
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

export const selectScreenshotList = (platform: string, videoId: string) => (state: RootState) => {
    if (state.screenshot.platform !== platform || state.screenshot.videoId !== videoId) {
        return [];
    }
    return state.screenshot.screenshots ?? [];
};
export const selectScreenshotSortOrder = (state: RootState) => state.screenshot.order;
export const selectCachedThumbnail = (state: RootState, platform: string, videoId: string, no: number): ImageDataUrl | null => {
    if (state.screenshot.platform === platform && state.screenshot.videoId === videoId) {
        return state.screenshot.thumbnails[no] ?? null;
    }
    return null;
};
