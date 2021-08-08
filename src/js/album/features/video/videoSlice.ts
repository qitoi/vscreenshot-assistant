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

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getVideoKey, RemoveVideoMessage, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import { RootState } from '../../store';
import { loadVideoSortOrder, saveVideoSortOrder, sortVideo, VideoSortOrder } from './VideoSort';

type VideoState = {
    videos: VideoInfo[],
    videoMap: { [key: string]: VideoInfo },
    order: VideoSortOrder,
};

const initialState: VideoState = {
    videos: [],
    videoMap: {},
    order: loadVideoSortOrder(),
};

type RemoveVideoPayload = {
    platform: string,
    videoId: string,
}

export const removeVideo = createAsyncThunk<RemoveVideoPayload, { platform: string, videoId: string }>
(
    'video/remove',
    async ({ platform, videoId }): Promise<RemoveVideoPayload> => {
        const remove: RemoveVideoMessage = {
            type: 'remove-video',
            platform,
            videoId,
        };
        await new Promise<void>(resolve => {
            chrome.runtime.sendMessage(remove, () => {
                resolve();
            });
        });
        return {
            platform,
            videoId,
        };
    }
);


const slice = createSlice({
    name: 'video',
    initialState,
    reducers: {
        setVideoList: (state, action: PayloadAction<VideoInfo[]>): void => {
            state.videoMap = {};
            for (const v of action.payload) {
                state.videoMap[getVideoKey(v)] = v;
            }
            state.videos = sortVideo(action.payload, state.order);
        },
        appendVideo: (state, action: PayloadAction<VideoInfo>): void => {
            state.videoMap[getVideoKey(action.payload)] = action.payload;
            state.videos = sortVideo(Object.values(state.videoMap), state.order);
        },
        setSortOrder: (state, action: PayloadAction<VideoSortOrder>): void => {
            saveVideoSortOrder(action.payload);
            state.videos = sortVideo(state.videos, action.payload);
            state.order = action.payload;
        },
    },
    extraReducers: builder => {
        builder.addCase(removeVideo.fulfilled, (state, action: PayloadAction<RemoveVideoPayload>): void => {
            delete state.videoMap[getVideoKey(action.payload)];
            state.videos = sortVideo(Object.values(state.videoMap), state.order);
        });
    },
});

export default slice.reducer;
export const { appendVideo, setVideoList, setSortOrder } = slice.actions;

export const selectVideoList = (state: RootState): typeof state.video.videos => state.video.videos;
export const selectVideoSortOrder = (state: RootState): typeof state.video.order => state.video.order;
