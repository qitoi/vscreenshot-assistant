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

import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { VideoInfo } from '../../../lib/types';
import { RootState } from '../../store';

export type SetActiveVideoPayload = VideoInfo | null;
export const setActiveVideo = createAction<SetActiveVideoPayload>('activeVideo/set');
type ActiveVideoState = {
    video: VideoInfo | null,
};

const initialState: ActiveVideoState = {
    video: null,
};

const slice = createSlice({
    name: 'activeVideo',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(setActiveVideo, (state, action: PayloadAction<SetActiveVideoPayload>): void => {
            state.video = action.payload;
        });
    },
});

export default slice.reducer;
export const selectActiveVideo = (state: RootState) => state.activeVideo.video;
