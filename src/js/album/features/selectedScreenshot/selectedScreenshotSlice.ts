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

import { compareScreenshotInfo, compareVideoInfo, ImageDataUrl, ScreenshotInfo, VideoInfoKey } from '../../../libs/types';
import { RootState } from '../../store';
import { setActiveVideo } from '../activeVideo/activeVideoSlice';
import { removeVideo } from '../video/videoSlice';


const SELECTED_SCREENSHOT_MAX_COUNT = 4;


type SelectMode = 'share' | 'delete';

export type ScreenshotInfoWithThumbnail = ScreenshotInfo & {
    thumbnail: ImageDataUrl;
};

type SelectedScreenshotState = {
    videoInfoKey: VideoInfoKey | null;
    selected: ScreenshotInfoWithThumbnail[];
    selectMode: SelectMode;
};

const initialState: SelectedScreenshotState = {
    videoInfoKey: null,
    selected: [],
    selectMode: 'share',
};


type AppendSelectedScreenshotPayload = {
    info: ScreenshotInfo;
    thumbnail: ImageDataUrl;
};
type RemoveSelectedScreenshotPayload = {
    info: ScreenshotInfo;
};
type SetSelectModePayload = {
    mode: SelectMode;
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
                if (isSelectableScreenshot(state.selected)) {
                    state.selected.push({ ...p.info, thumbnail: p.thumbnail });
                }
            }
        },
        removeSelectedScreenshot: (state, action: PayloadAction<RemoveSelectedScreenshotPayload>): void => {
            const p = action.payload;
            state.selected = state.selected.filter(s => !compareScreenshotInfo(s, p.info));
        },
        clearSelectedScreenshot: (state): void => {
            state.selected = [];
        },
        setScreenshotSelectMode: (state, action: PayloadAction<SetSelectModePayload>) => {
            if (state.selectMode !== action.payload.mode) {
                state.selected = [];
            }
            state.selectMode = action.payload.mode;
        },
    },
    extraReducers: builder => {
        builder.addCase(setActiveVideo.fulfilled, (state, action): void => {
            const video = action.payload.video;
            if (state.videoInfoKey === null || video === null || !compareVideoInfo(state.videoInfoKey, video)) {
                state.videoInfoKey = (video === null) ? null : { platform: video.platform, videoId: video.videoId };
                state.selectMode = 'share';
                state.selected = [];
            }
        });
        builder.addCase(removeVideo.fulfilled, (state, action): void => {
            if (state.videoInfoKey !== null && compareVideoInfo(state.videoInfoKey, action.payload)) {
                state.videoInfoKey = null;
                state.selected = [];
            }
        });
    },
});

export function isSelectableScreenshot(selected: ScreenshotInfoWithThumbnail[]): boolean {
    return selected.length < SELECTED_SCREENSHOT_MAX_COUNT;
}

export function isFulfilledSelectedScreenshot(selected: ScreenshotInfoWithThumbnail[]): boolean {
    return selected.length === SELECTED_SCREENSHOT_MAX_COUNT;
}

export default slice.reducer;
export const { toggleSelectedScreenshot, removeSelectedScreenshot, clearSelectedScreenshot, setScreenshotSelectMode } = slice.actions;

export const selectSelectedScreenshot = (state: RootState): typeof state.selectedScreenshot.selected => state.selectedScreenshot.selected;
export const selectScreenshotSelectMode = (state: RootState): typeof state.selectedScreenshot.selectMode => state.selectedScreenshot.selectMode;
