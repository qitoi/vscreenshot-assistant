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
import { chakra, Grid, GridProps, HTMLChakraProps } from '@chakra-ui/react';
import { createContext } from 'react';


type VirtualGridContainerProps = HTMLChakraProps<'div'>;
type VirtualGridContextType = {
    outerRef: React.RefObject<HTMLDivElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
};
const VirtualGridContext = createContext<VirtualGridContextType>({
    outerRef: React.createRef<HTMLDivElement>(),
    contentRef: React.createRef<HTMLDivElement>(),
});

type VirtualGridProps<T> = {
    items: T[];
    getItemKey: (item: T) => string;
    renderItem: (item: T) => React.ReactElement;
} & GridProps;


type VirtualGridReducerAction<T> = {
    type: 'items';
    items: T[];
} | {
    type: 'resize';
    outerHeight: number;
    gridWidth: number;
    gridRowGap: number;
    gridColumnGap: number;
    itemWidth: number;
    itemHeight: number;
    scrollMax: number;
} | {
    type: 'resize-outer';
    outerHeight: number;
} | {
    type: 'scroll';
    scrollTop: number;
};

type VirtualGridState<T> = {
    initialize: boolean;
    items: T[];

    outerHeight: number;
    outerScrollTop: number;
    gridColumnGap: number;
    gridRowGap: number;
    gridWidth: number;
    itemWidth: number;
    itemHeight: number;
    scrollMaxOffset: number;

    prevGridWidth: number;
    prevOuterHeight: number;

    // output
    clippedItems: T[];
    gridTop: number;
    gridOffset: number;
    innerHeight: number;
    forceScroll: number | null;
};

function VirtualGridStateInitializer<T>(): VirtualGridState<T> {
    return {
        initialize: true,
        items: [],
        clippedItems: [],

        outerHeight: 0,
        outerScrollTop: 0,
        gridColumnGap: 0,
        gridRowGap: 0,
        gridWidth: 0,
        itemWidth: 0,
        itemHeight: 0,
        scrollMaxOffset: 0,

        prevGridWidth: 0,
        prevOuterHeight: 0,

        gridTop: 0,
        gridOffset: 0,
        innerHeight: 0,
        forceScroll: null,
    }
}

function VirtualGridReducer<T>(state: VirtualGridState<T>, action: VirtualGridReducerAction<T>): VirtualGridState<T> {
    const calcColumnCount = (state: VirtualGridState<T>): number => Math.max(Math.floor((state.gridWidth + state.gridColumnGap) / Math.max(state.itemWidth + state.gridColumnGap, 1)), 2);
    const calcRowCount = (state: VirtualGridState<T>): number => Math.max(Math.ceil(state.items.length / calcColumnCount(state)), 1);
    const calcInnerHeight = (state: VirtualGridState<T>): number => calcRowCount(state) * (state.itemHeight + state.gridRowGap) - state.gridRowGap;
    const calcState = (state: VirtualGridState<T>): VirtualGridState<T> => {
        const arrayEqual = (a: any[], b: any[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

        // 不足している情報があれば先頭の1つだけ表示させて取得されるのを待つ
        if (state.gridWidth === 0 || state.outerHeight === 0 || state.itemWidth === 0 || state.itemHeight === 0) {
            const innerHeight = calcInnerHeight(state);
            const clippedItems = state.items.slice(0, 1);
            return {
                ...state,
                initialize: true,
                innerHeight,
                clippedItems: arrayEqual(state.clippedItems, clippedItems) ? state.clippedItems : clippedItems,
            };
        }

        const rowGap = state.gridRowGap;
        const rowHeightWithGap = state.itemHeight + rowGap;

        const columnCount = calcColumnCount(state);
        const rowCount = calcRowCount(state);
        const innerHeight = calcInnerHeight(state);
        const clipRowCount = Math.ceil((state.outerHeight + rowGap) / rowHeightWithGap);

        // 表示領域外の先読み行数
        const marginRowCount = 2;
        const marginHeight = marginRowCount * rowHeightWithGap;
        const displayStartRow = Math.round(state.outerScrollTop / rowHeightWithGap);
        const gridStartRow = Math.min(displayStartRow, rowCount - clipRowCount) - marginRowCount;
        const gridTop = Math.max(gridStartRow, 0) * rowHeightWithGap + marginHeight;
        const gridOffset = -marginHeight;

        const startIndex = Math.max(gridStartRow * columnCount, 0);
        const endIndex = (gridStartRow + clipRowCount + marginRowCount * 2) * columnCount;
        const nextClippedItems = state.items.slice(startIndex, endIndex);
        // 同じ範囲を表示する場合は再レンダリングを防ぐために前回の配列を流用
        const clippedItems = arrayEqual(state.clippedItems, nextClippedItems) ? state.clippedItems : nextClippedItems;

        return {
            ...state,
            initialize: false,
            gridTop,
            gridOffset,
            innerHeight,
            clippedItems,
        };
    };

    const calcStateKeepView = (state: VirtualGridState<T>, nextState: VirtualGridState<T>): VirtualGridState<T> => {
        // リサイズ後も極力同じ範囲を表示できるようにスクロール位置を補正
        const forceScroll = Math.max(Math.min(
            nextState.innerHeight - ((state.innerHeight - state.outerScrollTop) / state.innerHeight * nextState.innerHeight),
            nextState.scrollMaxOffset + nextState.innerHeight
        ), 0);
        return calcState({
            ...nextState,
            forceScroll,
            outerScrollTop: (forceScroll !== null) ? forceScroll : nextState.outerScrollTop,
        });
    };

    switch (action.type) {
        case 'items': {
            return calcState({
                ...state,
                items: action.items,
            });
        }
        case 'resize': {
            // アイテムサイズに変更がない場合、スクロールによるイベントのため何もしない
            if (state.itemWidth === action.itemWidth && state.itemHeight === action.itemHeight) {
                return state;
            }
            const nextState = calcState({
                ...state,
                itemWidth: action.itemWidth,
                itemHeight: action.itemHeight,
                gridWidth: action.gridWidth,
                gridRowGap: action.gridRowGap,
                gridColumnGap: action.gridColumnGap,
                outerHeight: action.outerHeight,
                scrollMaxOffset: action.scrollMax - state.innerHeight,
            });
            // 初回は各サイズが0になっているので、新しく来た値を前回の値として採用
            const currentState = (state.itemWidth === 0 || state.itemHeight === 0) ? nextState : state;
            return calcStateKeepView(currentState, nextState);
        }
        case 'resize-outer': {
            // 高さに変更がない場合は横幅の変更のため、ここでは何もせずresizeの処理にまかせる
            if (state.outerHeight === action.outerHeight) {
                return state;
            }
            return calcState({
                ...state,
                outerHeight,
            });
        }
        case 'scroll': {
            // forceScrollが設定されている状態でこのイベントが来たら解除
            if (state.forceScroll !== null) {
                return calcState({
                    ...state,
                    outerScrollTop: state.forceScroll,
                    forceScroll: null,
                });
            }
            // リサイズ時のスクロールでは何もしない
            else if (state.prevGridWidth !== state.gridWidth) {
                return {
                    ...state,
                    outerScrollTop: action.scrollTop,
                    prevGridWidth: state.gridWidth,
                    prevOuterHeight: state.outerHeight,
                };
            }
            else if (state.outerScrollTop !== action.scrollTop) {
                return calcState({
                    ...state,
                    outerScrollTop: action.scrollTop,
                });
            }
            break;
        }
    }

    return state;
}


export function VirtualGridContainer({ children, ...props }: VirtualGridContainerProps): React.ReactElement {
    const outerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const value = React.useMemo<VirtualGridContextType>(() => ({
        outerRef,
        contentRef,
    }), [outerRef, contentRef]);
    return (
        <VirtualGridContext.Provider value={value}>
            <chakra.div {...props} ref={outerRef}>
                <chakra.div ref={contentRef} display="flex" flexDir="column" minH="100%">
                    {children}
                </chakra.div>
            </chakra.div>
        </VirtualGridContext.Provider>
    );
}


export function VirtualGrid<T>({ items, getItemKey, renderItem, ...restProps }: VirtualGridProps<T>): React.ReactElement {
    const { templateAreas, gap, rowGap, columnGap, column, row, autoFlow, autoRows, templateRows, autoColumns, templateColumns, ...props } = restProps;
    const gridProps = { templateAreas, gap, rowGap, columnGap, column, row, autoFlow, autoRows, templateRows, autoColumns, templateColumns };

    const [state, dispatch] = React.useReducer(VirtualGridReducer, VirtualGridStateInitializer<T>());

    const context = React.useContext(VirtualGridContext);
    const outerElem = context.outerRef.current;
    const contentElem = context.contentRef.current;

    const gridRef = React.useRef<HTMLDivElement>(null);

    // 先頭の1つにリサイズ監視を組み込んだレンダリング済みアイテム
    const renderedItems = React.useMemo(() => state.clippedItems.map((item, index) => {
        let observer: ResizeObserver | null = null;
        const ref = (elem: HTMLDivElement | null): void => {
            if (elem) {
                observer = new ResizeObserver(entries => {
                    const entry = entries[0];
                    if (entry && entry.borderBoxSize[0] && outerElem && contentElem && gridRef.current) {
                        const { inlineSize: itemWidth, blockSize: itemHeight } = entry.borderBoxSize[0];
                        // スクロールにより監視対象のアイテムがアンマウントされた場合にサイズが0で来るので除外
                        if (itemWidth !== 0 && itemHeight !== 0) {
                            const gridStyle = getComputedStyle(gridRef.current);
                            dispatch({
                                type: 'resize',
                                outerHeight: outerElem.getBoundingClientRect().height,
                                gridWidth: gridRef.current.getBoundingClientRect().width,
                                gridRowGap: parseFloat(gridStyle.rowGap),
                                gridColumnGap: parseFloat(gridStyle.columnGap),
                                itemWidth: itemWidth,
                                itemHeight: itemHeight,
                                scrollMax: contentElem.getBoundingClientRect().height - (outerElem.getBoundingClientRect().height - parseFloat(getComputedStyle(outerElem).paddingTop)),
                            });
                        }
                    }
                });
                observer.observe(elem);
            }
            else {
                observer?.disconnect();
                observer = null;
            }
        };
        return (
            <div ref={(index === 0) ? ref : undefined} key={getItemKey(item)}>
                {renderItem(item)}
            </div>
        )
    }), [state.clippedItems, getItemKey, renderItem, outerElem, contentElem]);

    // outer のスクロール・リサイズ監視
    React.useEffect(() => {
        if (outerElem) {
            outerElem.addEventListener('scroll', () => {
                dispatch({ type: 'scroll', scrollTop: outerElem?.scrollTop ?? 0 });
            });
            // アイテムのリサイズ検出だけではウィンドウの高さが変わったことが取れず、アイテムの表示が更新されないため別途リサイズを監視する
            const observer = new ResizeObserver(entries => {
                const entry = entries[0];
                if (entry && entry.borderBoxSize[0]) {
                    const { blockSize: outerHeight } = entry.borderBoxSize[0];
                    if (outerHeight !== 0) {
                        dispatch({
                            type: 'resize-outer',
                            outerHeight,
                        });
                    }
                }
            });
            observer.observe(outerElem);
            return () => {
                observer.disconnect();
            };
        }
    }, [outerElem]);

    // アイテム変更通知
    React.useEffect(() => {
        dispatch({ type: 'items', items });
    }, [items]);

    // リサイズに伴なうスクロール位置の変更
    React.useEffect(() => {
        if (outerElem && state.forceScroll !== null) {
            outerElem.scrollTop = state.forceScroll;
        }
    }, [outerElem, state.forceScroll]);

    return (
        <chakra.div {...props} visibility={state.initialize ? 'hidden' : undefined} w="100%">
            <chakra.div w="100%" position="relative" height={`${state.innerHeight}px`}>
                <Grid {...gridProps} ref={gridRef} position="absolute" w="100%" top={`${state.gridTop}px`} transform={`translateY(${state.gridOffset}px)`}>
                    {renderedItems}
                </Grid>
            </chakra.div>
        </chakra.div>
    );
}
