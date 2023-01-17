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
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";

import { getFileExt } from '../../../libs/data-url';
import LazyImage, { isLazyImageSlideType, LazyImageSlideType } from "./LazyImage";
import Download from './Download';
import Information from "./Information";


export interface CustomLightboxSource {
    load: () => Promise<Blob | null>,
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
        case "init": {
            return [...action.slides];
        }
        case "load": {
            state[action.index] = { ...state[action.index], ...action.slide };
            return [...state];
        }
    }
    return state;
}

function CustomLightbox({ list, index, loop, open, onClose }: LightboxProps): React.ReactElement {
    const [slides, dispatch] = React.useReducer(CustomLightboxSourceReducer, []);
    React.useEffect(() => {
        dispatch({
            type: 'init',
            slides: list.map((src, idx) => ({
                src,
                onLoad: (width: number, height: number, image: Blob) => {
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
                },
            }))
        });
    }, [list]);

    const renderInformation = React.useCallback((slide: Slide) => {
        const index = slides.indexOf(slide as LazyImageSlideType);
        const no = (index + 1).toString();
        const max = list.length.toString();
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
                        <chakra.span>{no}&nbsp;/&nbsp;{list.length}</chakra.span>
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

    return (
        <Lightbox
            open={open}
            close={onClose}
            slides={slides}
            index={index}
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
                    backgroundColor: "rgba(0, 0, 0, .85)",
                    paddingTop: "4rem",
                    paddingBottom: "3rem"
                }
            }}
            plugins={[LazyImage, Information, Zoom, Fullscreen, Download]}
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
