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

import * as React from 'react';
import { useSelector } from 'react-redux';

type ParameterizedSelectorState<TSelector> =
    TSelector extends (state: infer TState, ...args: any[]) => any
        ? TState
        : never;

type ParameterizedSelectorParams<TSelector extends (...args: any[]) => any> =
    TSelector extends (state: any, ...args: infer TParams) => any
        ? TParams
        : never

export default function useParameterizedSelector<TSelector extends (state: any, ...args: any[]) => any>(selector: TSelector, ...params: ParameterizedSelectorParams<TSelector>): ReturnType<TSelector> {
    const s = React.useCallback(
        (state: ParameterizedSelectorState<TSelector>): ReturnType<TSelector> => selector(state, ...params),
        [selector, ...params]
    );
    return useSelector(s);
}
