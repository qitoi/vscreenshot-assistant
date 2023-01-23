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
 *
 *
 *  Original Source Code
 *  https://github.com/igordanchenko/yet-another-react-lightbox/blob/v2.2.7/src/core/modules/Carousel.tsx
 *
 *  MIT License
 *
 *  Copyright (c) 2022 Igor Danchenko
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

import * as React from "react";

import { Component, ComponentProps, Slide } from "yet-another-react-lightbox";
import { ContainerRect, useContainerRect } from "yet-another-react-lightbox/core";
import { clsx, composePrefix, cssClass, cssVar, isImageSlide, parseLengthPercentage } from "yet-another-react-lightbox/core";
import { ImageSlide } from "yet-another-react-lightbox/core";
import { useController } from "yet-another-react-lightbox/core";
import { useEvents } from "yet-another-react-lightbox/core";
import { useLightboxState } from "yet-another-react-lightbox/core";
import { CLASS_FLEX_CENTER, CLASS_FULLSIZE, MODULE_CAROUSEL, YARL_EVENT_BACKDROP_CLICK } from "yet-another-react-lightbox/core";

const cssPrefix = (value?: string) => composePrefix(MODULE_CAROUSEL, value);

const cssSlidePrefix = (value?: string) => composePrefix("slide", value);

type CarouselSlideProps = {
    slide: Slide;
    offset: number;
};

const CarouselSlide: React.FC<CarouselSlideProps> = ({ slide, offset }) => {
    const { setContainerRef, containerRect, containerRef } = useContainerRect();

    const { publish } = useEvents();
    const {
        state: { currentIndex },
    } = useLightboxState();
    const { getLightboxProps } = useController();
    const {
        render,
        carousel: { imageFit },
        on: { click: onClick },
    } = getLightboxProps();

    const renderSlide = (rect: ContainerRect) => {
        let rendered = render.slide?.(slide, offset, rect);

        if (!rendered && isImageSlide(slide)) {
            rendered = (
                <ImageSlide
                    slide={slide}
                    offset={offset}
                    render={render}
                    rect={rect}
                    imageFit={imageFit}
                    onClick={offset === 0 ? () => onClick?.(currentIndex) : undefined}
                />
            );
        }

        return rendered ? (
            <>
                {render.slideHeader?.(slide)}
                {(render.slideContainer ?? ((_, x) => x))(slide, rendered)}
                {render.slideFooter?.(slide)}
            </>
        ) : null;
    };

    const handleBackdropClick: React.MouseEventHandler = (event) => {
        const container = containerRef.current;
        const target = event.target instanceof HTMLElement ? event.target : undefined;
        if (
            target &&
            container &&
            (target === container ||
                // detect zoom wrapper
                (Array.from(container.children).find((x) => x === target) &&
                    target.classList.contains(cssClass(CLASS_FULLSIZE))))
        ) {
            publish(YARL_EVENT_BACKDROP_CLICK);
        }
    };

    return (
        <div
            ref={setContainerRef}
            className={clsx(
                cssClass(cssSlidePrefix()),
                offset === 0 && cssClass(cssSlidePrefix("current")),
                cssClass(CLASS_FLEX_CENTER)
            )}
            onClick={handleBackdropClick}
        >
            {containerRect && renderSlide(containerRect)}
        </div>
    );
};

const Placeholder: React.FC = () => <div className={cssClass("slide")} />;

type RobustCarouselState = {
    prevSlides: Slide[],
    prevGlobalIndex: number,
    prevKey: any,
    loop: number,
};

export const RobustCarouselComponent: Component = ({ slides, carousel: { finite, preload, padding, spacing } }: React.PropsWithChildren<ComponentProps>) => {
    const {
        state: { currentIndex, globalIndex },
        dispatch,
    } = useLightboxState();
    const [state, setState] = React.useState<RobustCarouselState>({ prevSlides: slides, prevGlobalIndex: globalIndex, prevKey: null, loop: 0 });

    const { setCarouselRef } = useController();

    React.useEffect(() => {
        // スライドのリストが変更された場合は元のスライドを表示するようにLightboxの表示位置を移動
        if (slides[currentIndex].key !== state.prevSlides[currentIndex].key) {
            const slideKeepIndex = slides.findIndex(v => v.key === state.prevKey);
            if (slideKeepIndex !== -1) {
                const diff = slideKeepIndex - currentIndex;
                dispatch({ increment: diff, animationDuration: 0 });
                setState({ ...state, prevSlides: slides, prevGlobalIndex: globalIndex });
            }
        }
        // スライドの移動を検出した場合は状態を更新
        else {
            const currentKey = slides[currentIndex].key;
            const direction = Math.sign(globalIndex - state.prevGlobalIndex);
            let loopDiff = 0;
            if ((direction < 0 && currentIndex == (slides.length - 1)) || (direction > 0 && currentIndex == 0)) {
                loopDiff = direction;
            }
            if (state.prevKey !== currentKey || loopDiff !== 0) {
                setState({ ...state, prevSlides: slides, prevGlobalIndex: globalIndex, prevKey: currentKey, loop: state.loop + loopDiff });
            }
        }
    }, [slides, currentIndex, globalIndex, state, dispatch]);

    const spacingValue = parseLengthPercentage(spacing);
    const paddingValue = parseLengthPercentage(padding);

    // スライドのリストが変更され、表示するスライドの index がずれた場合は同じスライドを表示し続けるため補正する
    let index = currentIndex;
    if (slides[currentIndex].key !== state.prevSlides[currentIndex].key) {
        const slideKeepIndex = slides.findIndex(v => v.key === state.prevKey);
        if (slideKeepIndex !== -1) {
            index = slideKeepIndex;
        }
    }

    // globalIndex の差分からスライドを検出、ループの境界位置であればループ数を補正する
    const direction = Math.sign(globalIndex - state.prevGlobalIndex);
    let loopDiff = 0;
    if ((direction < 0 && currentIndex == (slides.length - 1)) || (direction > 0 && currentIndex == 0)) {
        loopDiff = direction;
    }
    const loop = state.loop + loopDiff;

    const items = [];

    if (slides?.length > 0) {
        for (let i = index - preload; i < index; i += 1) {
            const slide = slides[(i + preload * slides.length) % slides.length];
            const suffix = (i < 0) ? loop - 1 : loop;
            const key = `${slide.key}:${suffix}`;
            items.push(
                !finite || i >= 0 ? (
                    <CarouselSlide key={key} slide={slide} offset={i - index} />
                ) : (
                    <Placeholder key={key} />
                )
            );
        }

        {
            const key = `${slides[index].key}:${loop}`;
            items.push(<CarouselSlide key={key} slide={slides[index]} offset={0} />);
        }

        for (let i = index + 1; i <= index + preload; i += 1) {
            const slide = slides[i % slides.length];
            const suffix = (i >= slides.length) ? loop + 1 : loop;
            const key = `${slide.key}:${suffix}`;
            items.push(
                !finite || i <= slides.length - 1 ? (
                    <CarouselSlide key={key} slide={slide} offset={i - index} />
                ) : (
                    <Placeholder key={key} />
                )
            );
        }
    }

    return (
        <div
            ref={setCarouselRef}
            className={clsx(cssClass(cssPrefix()), items.length > 0 && cssClass(cssPrefix("with_slides")))}
            style={
                {
                    [`${cssVar(cssPrefix("slides_count"))}`]: items.length,
                    [`${cssVar(cssPrefix("spacing_px"))}`]: spacingValue.pixel || 0,
                    [`${cssVar(cssPrefix("spacing_percent"))}`]: spacingValue.percent || 0,
                    [`${cssVar(cssPrefix("padding_px"))}`]: paddingValue.pixel || 0,
                    [`${cssVar(cssPrefix("padding_percent"))}`]: paddingValue.percent || 0,
                } as React.CSSProperties
            }
        >
            {items}
        </div>
    );
};
