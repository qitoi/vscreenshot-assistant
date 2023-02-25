/*
 *  Copyright 2023 qitoi
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
import { chakra, Text } from '@chakra-ui/react';
import prettyBytes from 'pretty-bytes';

import Lightbox, { Slide } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';

import { getFileExt } from '../../../libs/data-url';
import LazyImage, { isLazyImageSlideType, LazyImageSlideType, LazyLoadFuncType } from './LazyImage';
import Download from './Download';
import Information from './Information';
import ConsistentCarousel from './ConsistentCarousel';


export interface CustomLightboxSource {
    key: number | string,
    load: LazyLoadFuncType,
}

type LightboxProps = {
    list: CustomLightboxSource[],
    index: number,
    loop: boolean,
    open: boolean,
    onClose: () => void,
};

type CustomLightboxSourceAction = {
    type: 'init',
    slides: LazyImageSlideType[],

} | {
    type: 'load',
    index: number,
    slide: Partial<LazyImageSlideType>,
};

function CustomLightboxSourceReducer(state: LazyImageSlideType[], action: CustomLightboxSourceAction): LazyImageSlideType[] {
    switch (action.type) {
        case 'init': {
            // リストが変更されたとき、全てのスライドを新規のオブジェクトにしてしまうと現在表示しているスライドでも再レンダリングされロードが走ってしまう
            // 同じkeyのスライドが前のステートに存在すれば、そのオブジェクトを流用することで再レンダリングを防ぐ
            const prevSlideMap = state.reduce<Record<string, LazyImageSlideType>>((acc, current) => {
                acc[current.key] = current;
                return acc;
            }, {});
            return action.slides.map(s => prevSlideMap[s.key] ?? s);
        }
        case 'load': {
            state[action.index] = { ...state[action.index], ...action.slide };
            return [...state];
        }
    }
    return state;
}

type ImageCacheValue = {
    result: Promise<Blob | null>;
    count: number,
};

function useImageCache(deps: React.DependencyList) {
    const cache = React.useMemo(() => new WeakMap<LazyLoadFuncType, ImageCacheValue>(), deps);
    const loadFunc = React.useCallback((load: LazyLoadFuncType) => {
        const cached = cache.get(load);
        if (cached) {
            cached.count += 1;
            return cached.result;
        }
        const result = load();
        cache.set(load, {
            result,
            count: 1,
        });
        return result;
    }, [cache]);
    const releaseFunc = React.useCallback((load: LazyLoadFuncType) => {
        const cached = cache.get(load);
        if (cached) {
            cached.count -= 1;
            if (cached.count > 0) {
                return false;
            }
            cache.delete(load);
        }
        return true;
    }, [cache]);
    return {
        load: loadFunc,
        release: releaseFunc,
    };
}

function CustomLightbox({ list, index, loop, open, onClose }: LightboxProps): React.ReactElement | null {
    const [slides, dispatch] = React.useReducer(CustomLightboxSourceReducer, []);
    const { load, release } = useImageCache([list]);

    React.useEffect(() => {
        const generateRelease = (src: CustomLightboxSource, idx: number) => () => {
            if (release(src.load)) {
                dispatch({
                    type: 'load',
                    index: idx,
                    slide: {
                        width: undefined,
                        height: undefined,
                        size: undefined,
                        getImage: undefined,
                    },
                });
            }
        };
        const generateOnLoad = (idx: number) => (width: number, height: number, image: Blob): void => {
            dispatch({
                type: 'load',
                index: idx,
                slide: {
                    width,
                    height,
                    size: image.size,
                    getImage: async () => {
                        return { blob: image, name: 'image' + getFileExt(image.type) };
                    },
                }
            })
        };
        dispatch({
            type: 'init',
            slides: list.map<LazyImageSlideType>((src, idx) => ({
                src,
                key: src.key,
                load: () => load(src.load),
                release: generateRelease(src, idx),
                onLoad: generateOnLoad(idx),
            })),
        });
    }, [list, load, release]);

    const renderInformation = React.useCallback((slide: Slide) => {
        const index = slides.indexOf(slide as LazyImageSlideType);
        const no = (index + 1).toString();
        const max = slides.length.toString();
        const pad = '0'.repeat(max.length - no.length);
        const isLazyImage = isLazyImageSlideType(slide);
        const fileSize = isLazyImage ? (slide.size ?? 0) : 0;
        const fileSizeStr = (fileSize > 0) ? prettyBytes(fileSize, { binary: true, minimumFractionDigits: 0, maximumFractionDigits: 1 }) : null;

        return (
            <>
                <chakra.div
                    display="flex"
                    alignItems="center"
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="4rem"
                    paddingX="1rem"
                    color="white"
                    whiteSpace="nowrap"
                    backgroundColor="blackAlpha.500">
                    <chakra.span fontSize="1rem">
                        <chakra.span visibility="hidden">{pad}</chakra.span>
                        <chakra.span>{no}&nbsp;/&nbsp;{slides.length}</chakra.span>
                    </chakra.span>
                </chakra.div>
                <chakra.div
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    position="absolute"
                    bottom={0}
                    left={0}
                    width="100%"
                    height="3rem"
                    paddingX="1rem"
                    color="white"
                    whiteSpace="nowrap"
                    backgroundColor="blackAlpha.500">
                    <chakra.div>
                        {isLazyImage && slide.src.renderFooter?.(slide)}
                    </chakra.div>
                    {fileSizeStr && (<Text>{fileSizeStr}</Text>)}
                </chakra.div>
            </>
        );
    }, [slides]);

    if (slides.length === 0) {
        return null;
    }

    return (
        <Lightbox
            plugins={[LazyImage, Information, Zoom, Fullscreen, Download, ConsistentCarousel]}
            open={open}
            close={onClose}
            slides={slides}
            index={index}
            controller={{
                closeOnBackdropClick: true,
            }}
            carousel={{
                finite: !loop,
                preload: 1,
            }}
            animation={{
                swipe: 200,
                zoom: 200,
            }}
            styles={{
                container: {
                    backgroundColor: 'rgba(0, 0, 0, .85)',
                    paddingTop: '4rem',
                    paddingBottom: '3rem'
                }
            }}
            information={{
                render: renderInformation,
            }}
            zoom={{
                maxZoomPixelRatio: 16,
                zoomInMultiplier: 1.5,
                scrollToZoom: false,
                keyboardMoveDistance: 0,
            }}
        />
    );
}

export default CustomLightbox;
