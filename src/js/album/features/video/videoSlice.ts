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

import { getVideoKey, VideoInfo } from '../../../libs/types';
import * as storage from '../../../libs/storage';
import * as messages from '../../../libs/messages';
import * as videoSort from '../../../background/video-sort';
import { RootState } from '../../store';


type VideoState = {
    videos: VideoInfo[],
    videoMap: { [key: string]: VideoInfo },
    order: videoSort.VideoSortOrder | null,
};

const initialState: VideoState = {
    videos: [],
    videoMap: {},
    order: null,
};

type FetchVideoListPayload = {
    videos: VideoInfo[],
    order: videoSort.VideoSortOrder,
};
type RemoveVideoPayload = {
    platform: string,
    videoId: string,
}
type FetchSortOrderPayload = {
    order: videoSort.VideoSortOrder,
};
type SetSortOrderPayload = {
    order: videoSort.VideoSortOrder,
};


export const fetchVideoList = createAsyncThunk<FetchVideoListPayload, void>(
    'screenshot/fetchVideoList',
    async () => {
        const videos = await storage.getVideoInfoList();
        const order = await videoSort.loadVideoSortOrder();
        return {
            videos,
            order,
        };
    }
);

export const removeVideo = createAsyncThunk<RemoveVideoPayload, { platform: string, videoId: string, removeFromStorage: boolean }>(
    'video/remove',
    async ({ platform, videoId, removeFromStorage }) => {
        if (removeFromStorage) {
            const remove: messages.RemoveVideoRequest = {
                type: 'remove-video',
                platform,
                videoId,
            };
            await new Promise<void>(resolve => {
                messages.sendMessage(remove, message => {
                    if (message.status === 'complete') {
                        resolve();
                    }
                });
            });
        }
        return {
            platform,
            videoId,
        };
    }
);

export const setVideoSortOrder = createAsyncThunk<FetchSortOrderPayload, SetSortOrderPayload>(
    'screenshot/setVideoSortOrder',
    async ({ order }) => {
        await videoSort.saveVideoSortOrder(order);
        return {
            order,
        };
    }
);


const slice = createSlice({
    name: 'video',
    initialState,
    reducers: {
        appendVideo: (state, action: PayloadAction<VideoInfo>): void => {
            state.videoMap[getVideoKey(action.payload)] = action.payload;
            state.videos = videoSort.sortVideo(Object.values(state.videoMap), state.order ?? videoSort.DefaultSortOrder);
        },
    },
    extraReducers: builder => {
        builder.addCase(fetchVideoList.fulfilled, (state, action): void => {
            state.videoMap = {};
            for (const v of action.payload.videos) {
                state.videoMap[getVideoKey(v)] = v;
            }
            state.videos = videoSort.sortVideo(action.payload.videos, action.payload.order);
            state.order = action.payload.order;
        });
        builder.addCase(removeVideo.fulfilled, (state, action: PayloadAction<RemoveVideoPayload>): void => {
            delete state.videoMap[getVideoKey(action.payload)];
            state.videos = videoSort.sortVideo(Object.values(state.videoMap), state.order ?? videoSort.DefaultSortOrder);
        });
        builder.addCase(setVideoSortOrder.fulfilled, (state, action): void => {
            state.videos = videoSort.sortVideo(state.videos, action.payload.order);
            state.order = action.payload.order;
        });
    },
});

export default slice.reducer;
export const { appendVideo } = slice.actions;

export const selectVideoList = (state: RootState): typeof state.video.videos => state.video.videos;
export const selectVideoSortOrder = (state: RootState): typeof state.video.order => state.video.order;
