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
    empty: boolean,
};

const initialExpandImage: ExpandImage = {
    key: '',
    src: '',
    empty: true,
};

type ActionType<T> =
    { type: 'list', list: T[], loop: boolean, getKey: (t: T) => string }
    | { type: 'select', target: T, getKey: (t: T) => string }
    | { type: 'loading', key: string }
    | { type: 'loaded', key: string, image: string };

type StateType<T> = {
    current: T | null,
    list: T[],
    loop: boolean,
    images: ExpandImage[],
};

type LightboxProps<T> = {
    list: T[],
    initial: T,
    loop: boolean,
    getKey: (i: T) => string;
    loadImage: (i: T) => Promise<ImageDataUrl>,
    onClose: () => void,
};

function getShowTargets<T>(list: T[], target: T, loop: boolean): (T | null)[] {
    const targets: (T | null)[] = [];
    const index = list.indexOf(target);
    if (index !== -1) {
        for (const offset of [0, 1, -1]) {
            const idx = index + offset;
            // ループ設定
            if (loop) {
                const t = list[(idx + list.length) % list.length];
                targets.push(t);
            }
            // ループ設定でない場合は範囲外はnull
            else {
                if (idx in list) {
                    targets.push(list[idx]);
                }
                else {
                    targets.push(null);
                }
            }
        }
    }
    return targets;
}

function getLoadTargets<T>(list: T[], target: T, loop: boolean): T[] {
    const targets: T[] = [];
    const candidates = getShowTargets(list, target, loop);
    for (const t of candidates) {
        if (t !== null && !targets.includes(t)) {
            targets.push(t);
        }
    }
    return targets;
}

function getInitialImages(): ExpandImage[] {
    return [{ ...initialExpandImage }, { ...initialExpandImage }, { ...initialExpandImage }];
}

function getImages<T>(list: T[], target: T | null, loop: boolean, getKey: (t: T) => string, prevImages: ExpandImage[]): ExpandImage[] {
    if (target === null) {
        return getInitialImages();
    }

    const imageCache = prevImages.reduce<Record<string, ExpandImage>>((acc, current) => {
        acc[current.key] = current;
        return acc;
    }, {});

    const images: ExpandImage[] = getInitialImages();
    const targets = getShowTargets<T>(list, target, loop);
    for (const index in targets) {
        const t = targets[index];
        // 表示対象がnullの場合は空、nullでなければロードする
        if (t !== null) {
            const key = getKey(t);
            // 既にロード済みの画像であれば流用
            if (key in imageCache) {
                images[index] = imageCache[key];
            }
            // 未ロードであれば仮画像を設定しつつロード待ち
            else {
                images[index] = { key, src: chrome.runtime.getURL('img/empty.png'), empty: true };
            }
        }
    }

    return images;
}

function reducer<T>(state: StateType<T>, action: ActionType<T>): StateType<T> {
    switch (action.type) {
        // リストの変更に伴なう表示画像リストの更新
        case 'list': {
            const list = [...action.list];
            return {
                ...state,
                list,
                loop: action.loop,
                images: getImages(list, state.current, action.loop, action.getKey, state.images)
            };
        }

        // 選択画像の変更に伴なう表示画像リストの更新
        case 'select': {
            const current = action.target;
            return {
                ...state,
                current,
                images: getImages(state.list, current, state.loop, action.getKey, state.images)
            };
        }

        // ロード開始された画像は未処理フラグを落とす
        case 'loading': {
            const images = state.images;
            for (const p of images) {
                if (p.key === action.key) {
                    p.empty = false;
                }
            }
            return {
                ...state,
                images,
            };
        }

        // ロードが完了された画像を反映
        case 'loaded': {
            const images = state.images;
            for (const p of images) {
                if (p.key === action.key) {
                    p.src = action.image;
                    p.empty = false;
                }
            }
            return {
                ...state,
                images,
            };
        }
    }
}


function useCustomLightboxLoad<T>(getKey: (t: T) => string, loadImage: (t: T) => Promise<ImageDataUrl>) {
    const [state, dispatch] = React.useReducer<React.Reducer<StateType<T>, ActionType<T>>>(reducer, { images: getInitialImages(), list: [], loop: false, current: null });

    const setList = React.useCallback((list: T[], loop: boolean) => {
        dispatch({ type: 'list', list, loop, getKey });
    }, [dispatch, getKey]);

    const setCurrent = React.useCallback((target: T) => {
        dispatch({ type: 'select', target, getKey });
    }, [dispatch, getKey]);

    React.useEffect(() => {
        if (state.current !== null) {
            // ステート更新時にロードが必要な画像があればロード実行
            const targets = getLoadTargets(state.list, state.current, state.loop);
            const loaded = state.images.filter(i => !i.empty).map(i => i.key);
            const loadTargets: T[] = targets.filter(t => !loaded.includes(getKey(t)));
            for (const t of loadTargets) {
                const key = getKey(t);
                dispatch({ type: 'loading', key });
                loadImage(t).then(image => {
                    dispatch({ type: 'loaded', key, image });
                });
            }
        }
    }, [state, dispatch, getKey, loadImage]);

    return {
        setList,
        setCurrent,
        current: state.current,
        images: state.images,
    };
}


const CustomLightbox = <T, >({ list, initial, loop, getKey, loadImage, onClose }: LightboxProps<T>): React.ReactElement => {
    const { setList, setCurrent, current, images: [main, next, prev] } = useCustomLightboxLoad(getKey, loadImage);

    // 初期リスト・リスト更新時の反映
    React.useEffect(() => {
        setList(list, loop);
    }, [setList, list, loop]);

    // 初期選択の画像指定
    React.useEffect(() => {
        setCurrent(initial);
    }, [setCurrent, initial]);

    const movePrev = React.useCallback(() => {
        if (current !== null) {
            const index = list.indexOf(current);
            const next = (index + list.length - 1) % list.length;
            const target = list[next];
            setCurrent(target);
        }
    }, [setCurrent, current, list]);

    const moveNext = React.useCallback(() => {
        if (current !== null) {
            const index = list.indexOf(current);
            const next = (index + 1) % list.length;
            const target = list[next];
            setCurrent(target);
        }
    }, [setCurrent, current, list]);

    return (
        <Lightbox
            mainSrc={main.src}
            nextSrc={next.src}
            prevSrc={prev.src}
            onMoveNextRequest={moveNext}
            onMovePrevRequest={movePrev}
            onCloseRequest={onClose}
            animationOnKeyInput={true}
        />
    );
};

export default CustomLightbox;
