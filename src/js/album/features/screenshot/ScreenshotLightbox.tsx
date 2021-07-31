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

import { getScreenshotKey, ScreenshotInfo, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';


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


type ScreenshotLightboxProps = {
    video: VideoInfo,
    screenshots: ScreenshotInfo[],
    index: number,
    onClose: () => void,
};

export function ScreenshotLightbox({ video, screenshots, index, onClose }: ScreenshotLightboxProps) {
    const [state, dispatch] = React.useReducer(reducer, { images: [{ ...initialExpandImage }, { ...initialExpandImage }, { ...initialExpandImage }], cursor: 0 });

    const loadImage = React.useCallback((platform: string, videoId: string, no: number) => {
        storage.getScreenshot(platform, videoId, no)
            .then(image => {
                dispatch({ type: 'load', key: getScreenshotKey({ platform, videoId, no }), image: image });
            });
    }, []);

    React.useEffect(() => {
        if (screenshots.length > 0) {
            let keys = ['', '', ''];
            for (const i of [0, -1, 1]) {
                const no = screenshots[(index + i + screenshots.length) % screenshots.length].no;
                keys[i + 1] = getScreenshotKey({ platform: video.platform, videoId: video.videoId, no: no });
                loadImage(video.platform, video.videoId, no);
            }
            dispatch({ type: 'init', keys: keys, cursor: index });
        }
    }, [video, screenshots, index]);

    return (
        <Lightbox
            mainSrc={state.images[1].src}
            prevSrc={state.images[0].src}
            nextSrc={state.images[2].src}
            onMovePrevRequest={() => {
                const cursor = (state.cursor + screenshots.length - 1) % screenshots.length;
                const no = screenshots[(cursor + screenshots.length - 1) % screenshots.length].no;
                const key = getScreenshotKey({ platform: video.platform, videoId: video.videoId, no });
                dispatch({ type: 'prev', key, cursor });
                loadImage(video.platform, video.videoId, no);
            }}
            onMoveNextRequest={() => {
                const cursor = (state.cursor + 1) % screenshots.length;
                const no = screenshots[(cursor + 1) % screenshots.length].no;
                const key = getScreenshotKey({ platform: video.platform, videoId: video.videoId, no });
                dispatch({ type: 'next', key, cursor });
                loadImage(video.platform, video.videoId, no);
            }}
            onCloseRequest={onClose}
        />
    );
}
