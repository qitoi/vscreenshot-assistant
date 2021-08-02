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
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

import { ImageDataUrl } from '../../lib/types';


type ExpandImage = {
    key: string,
    src: string,
};

const initialExpandImage: ExpandImage = {
    key: '',
    src: '',
};

type ActionType =
    { type: 'reset' }
    | { type: 'init', keys: string[], cursor: number }
    | { type: 'next', key: string, cursor: number }
    | { type: 'prev', key: string, cursor: number }
    | { type: 'load', key: string, image: string };

type StateType = {
    cursor: number,
    images: ExpandImage[],
};

function reducer(state: StateType, action: ActionType): StateType {
    const newState = { ...state };
    switch (action.type) {
        case 'init': {
            for (let i = 0; i < 3 && i < action.keys.length; ++i) {
                newState.images[i].key = action.keys[i];
            }
            newState.cursor = action.cursor;
            break;
        }
        case 'next': {
            newState.images.push({ key: action.key, src: '' });
            newState.images.shift();
            newState.cursor = action.cursor;
            break;
        }
        case 'prev': {
            newState.images.unshift({ key: action.key, src: '' });
            newState.images.pop();
            newState.cursor = action.cursor;
            break;
        }
        case 'load': {
            for (let p of newState.images) {
                if (p.key === action.key) {
                    p.src = action.image;
                }
            }
            break;
        }
    }
    return newState;
}


type LightboxProps<T> = {
    list: T[],
    index: number,
    getKey: (i: T) => string;
    loadImage: (i: T) => Promise<ImageDataUrl>,
    onClose: () => void,
};

export function CustomLightbox<T>({ list, index, getKey, loadImage, onClose }: LightboxProps<T>) {
    const [state, dispatch] = React.useReducer(reducer, { images: [{ ...initialExpandImage }, { ...initialExpandImage }, { ...initialExpandImage }], cursor: 0 });

    const load = React.useCallback((target: T) => {
        loadImage(target).then(image => {
            dispatch({ type: 'load', key: getKey(target), image });
        });
    }, [getKey, loadImage]);

    React.useEffect(() => {
        if (list.length > 0) {
            let keys = ['', '', ''];
            for (const i of [0, -1, 1]) {
                const target = list[(index + i + list.length) % list.length];
                keys[i + 1] = getKey(target);
                load(target);
            }
            dispatch({ type: 'init', keys: keys, cursor: index });
        }
    }, [list, index, getKey, load]);

    const handleMovePrevRequest = React.useCallback(() => {
        const cursor = (state.cursor + list.length - 1) % list.length;
        const target = list[(cursor + list.length - 1) % list.length];
        const key = getKey(target);
        dispatch({ type: 'prev', key, cursor });
        load(target);
    }, [state.cursor, load]);

    const handleMoveNextRequest = React.useCallback(() => {
        const cursor = (state.cursor + 1) % list.length;
        const target = list[(cursor + 1) % list.length];
        const key = getKey(target);
        dispatch({ type: 'next', key, cursor });
        load(target);
    }, [state.cursor, load]);

    return (
        <Lightbox
            mainSrc={state.images[1].src}
            prevSrc={state.images[0].src}
            nextSrc={state.images[2].src}
            onMovePrevRequest={handleMovePrevRequest}
            onMoveNextRequest={handleMoveNextRequest}
            onCloseRequest={onClose}
        />
    );
}
