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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './store';
import { compareScreenshotInfo, compareVideoInfo, ImageDataUrl, ScreenshotInfo } from '../../lib/types';
import { setActiveVideo, SetActiveVideoPayload } from './activeVideoAction';

export type ScreenshotInfoWithThumbnail = ScreenshotInfo & {
    thumbnail: ImageDataUrl,
};

type SelectedScreenshotState = {
    platform: string,
    videoId: string,
    selected: ScreenshotInfoWithThumbnail[],
};

const initialState: SelectedScreenshotState = {
    platform: null,
    videoId: null,
    selected: [],
};


type AppendSelectedScreenshotPayload = {
    info: ScreenshotInfo,
    thumbnail: ImageDataUrl,
};
type RemoveSelectedScreenshotPayload = {
    info: ScreenshotInfo,
};

const slice = createSlice({
    name: 'selectedScreenshot',
    initialState,
    reducers: {
        toggleSelectedScreenshot: (state, action: PayloadAction<AppendSelectedScreenshotPayload>): void => {
            const p = action.payload;
            const filtered = state.selected.filter(s => !compareScreenshotInfo(s, p.info));
            if (filtered.length < state.selected.length) {
                state.selected = filtered;
            }
            else {
                state.selected.push({ ...p.info, thumbnail: p.thumbnail });
            }
        },
        removeSelectedScreenshot: (state, action: PayloadAction<RemoveSelectedScreenshotPayload>): void => {
            const p = action.payload;
            state.selected = state.selected.filter(s => !compareScreenshotInfo(s, p.info));
        },
    },
    extraReducers: builder => {
        builder
            .addCase(setActiveVideo, (state, action: PayloadAction<SetActiveVideoPayload>): void => {
                if (action.payload === null || !compareVideoInfo(state, action.payload)) {
                    state.selected = [];
                }
            });
    },
});

export default slice.reducer;
export const { toggleSelectedScreenshot, removeSelectedScreenshot } = slice.actions;

export const selectSelectedScreenshot = (state: RootState) => state.selectedScreenshot.selected;
