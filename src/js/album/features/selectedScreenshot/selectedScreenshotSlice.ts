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

import { compareScreenshotInfo, compareVideoInfo, ImageDataUrl, ScreenshotInfo, VideoInfoKey } from '../../../lib/types';
import { RootState } from '../../store';
import { setActiveVideo } from '../activeVideo/activeVideoSlice';

export type ScreenshotInfoWithThumbnail = ScreenshotInfo & {
    thumbnail: ImageDataUrl,
};

type SelectedScreenshotState = {
    videoInfoKey: VideoInfoKey | null,
    selected: ScreenshotInfoWithThumbnail[],
};

const initialState: SelectedScreenshotState = {
    videoInfoKey: null,
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
            .addCase(setActiveVideo.fulfilled, (state, action): void => {
                const video = action.payload.video;
                if (state.videoInfoKey === null || video === null || !compareVideoInfo(state.videoInfoKey, video)) {
                    state.videoInfoKey = (video === null) ? null : { platform: video.platform, videoId: video.videoId };
                    state.selected = [];
                }
            });
    },
});

export default slice.reducer;
export const { toggleSelectedScreenshot, removeSelectedScreenshot } = slice.actions;

export const selectSelectedScreenshot = (state: RootState): typeof state.selectedScreenshot.selected => state.selectedScreenshot.selected;
