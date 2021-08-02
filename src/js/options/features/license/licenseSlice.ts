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

import { RootState } from '../../store';

type LicenseNotice = {
    name: string,
    license: string,
};

type LicensesState = {
    licenses: LicenseNotice[];
};

const initialState: LicensesState = {
    licenses: [],
};


type FetchLicensesPayload = {
    licenses: LicenseNotice[];
};

function parseLicenseNotices(text: string): LicenseNotice[] {
    const split = text.split('\n------------------------------\n');
    split.shift();
    const notices: LicenseNotice[] = [];
    while (split.length > 0) {
        const name = split.shift()?.trim();
        let license = split.shift();
        license = license?.substring(1, license?.length - 1);
        if (name === undefined || license === undefined) {
            break;
        }
        notices.push({ name, license });
    }
    return notices;
}

export const fetchLicenses = createAsyncThunk<FetchLicensesPayload>
(
    'licenses/fetch',
    async (): Promise<FetchLicensesPayload> => {
        const res = await fetch(chrome.runtime.getURL('THIRD-PARTY-NOTICES'));
        const text = await res.text();
        return {
            licenses: parseLicenseNotices(text),
        };
    }
);


const slice = createSlice({
    name: 'licenses',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchLicenses.fulfilled, (state, action: PayloadAction<FetchLicensesPayload>): void => {
                state.licenses = action.payload.licenses;
            });
    },
});

export default slice.reducer;

export const selectLicenses = (state: RootState): typeof state.licenses.licenses => state.licenses.licenses;
