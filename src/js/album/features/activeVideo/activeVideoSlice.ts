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

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { compareVideoInfo, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import { RootState } from '../../store';


type ActiveVideoState = {
    video: VideoInfo | null,
    hashtags: string[],
};

const initialState: ActiveVideoState = {
    video: null,
    hashtags: [],
};

type SetActiveVideoPayload = {
    video: VideoInfo | null,
    hashtags: string[],
};

export const setActiveVideo = createAsyncThunk<SetActiveVideoPayload, VideoInfo | null>(
    'activeVideo/setActiveVideo',
    async (video): Promise<SetActiveVideoPayload> => {
        if (video === null) {
            return {
                video,
                hashtags: [],
            };
        }
        const hashtags = await storage.getVideoSelectedHashtags(video.platform, video.videoId);
        return {
            video,
            hashtags,
        };
    }
);

type SetHashtagsPayload = {
    video: VideoInfo,
    hashtags: string[],
};

export const setHashtags = createAsyncThunk<SetHashtagsPayload, SetHashtagsPayload>(
    'activeVideo/setHashtags',
    async ({ video, hashtags }): Promise<SetHashtagsPayload> => {
        await storage.saveVideoSelectedHashtags(video.platform, video.videoId, hashtags);
        return { video, hashtags };
    }
);


const slice = createSlice({
    name: 'activeVideo',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(setActiveVideo.fulfilled, (state, action): void => {
            state.video = action.payload.video;
            state.hashtags = action.payload.hashtags;
        });
        builder.addCase(setHashtags.fulfilled, (state, action): void => {
            if (state.video !== null && compareVideoInfo(state.video, action.payload.video)) {
                state.hashtags = action.payload.hashtags;
            }
        });
    },
});

export default slice.reducer;
export const selectActiveVideo = (state: RootState): typeof state.activeVideo.video => state.activeVideo.video;
export const selectHashtags = (state: RootState): typeof state.activeVideo.hashtags => state.activeVideo.hashtags;
