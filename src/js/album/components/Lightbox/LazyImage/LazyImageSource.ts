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

import { GenericSlide } from "yet-another-react-lightbox";
import { CustomLightboxSource } from "../CustomLightbox";

export type LazyLoadFuncType = () => Promise<Blob | null>;

export interface LazyImageSlideType extends GenericSlide {
    src: CustomLightboxSource,
    load: LazyLoadFuncType,
    release?: () => void,
    width?: number,
    height?: number,
    size?: number,
    onLoad?: (width: number, height: number, image: Blob) => void,
};

export function isLazyImageSlideType(value: any): value is LazyImageSlideType {
    if (typeof value.src === 'object') {
        return typeof value.src.load === 'function';
    }
    return false;
}
