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

import { DefaultPreferences, Preferences } from '../../../lib/prefs';
import { RootState } from '../../store';

type PreferencesState = {
    preferences: Preferences,
};

const initialState: PreferencesState = {
    preferences: DefaultPreferences,
};

type SetPreferencesPayload = Preferences;


const slice = createSlice({
    name: 'preferences',
    initialState,
    reducers: {
        setPreferences: (state, action: PayloadAction<SetPreferencesPayload>): void => {
            state.preferences = action.payload;
        },
    },
});

export default slice.reducer;
export const { setPreferences } = slice.actions;

export const selectThumbnailPreferences = (state: RootState): typeof state.preferences.preferences.thumbnail => state.preferences.preferences.thumbnail;
