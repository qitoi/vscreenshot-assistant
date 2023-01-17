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

import * as React from "react";
import { Image, Spinner } from "@chakra-ui/react";

type LazyImageProps = {
    load: () => Promise<Blob | null>,
    onLoad?: (width: number, height: number, image: Blob) => void,
};

export function LazyImageComponent({ load, onLoad }: LazyImageProps) {
    const ref = React.useRef<HTMLImageElement>(null);
    const [loaded, setLoaded] = React.useState<boolean>(false);

    React.useEffect(() => {
        let src: string | null = null;
        (async () => {
            const image = await load();
            if (ref.current && image) {
                ref.current.onload = () => {
                    setLoaded(true);
                    onLoad?.(ref.current?.naturalWidth ?? 0, ref.current?.naturalHeight ?? 0, image);
                };
                src = URL.createObjectURL(image);
                ref.current.src = src;
            }
        })();
        return () => {
            if (src) {
                URL.revokeObjectURL(src);
            }
        };
    }, [ref, load, onLoad]);

    return (
        <>
            {!loaded && <Spinner color="white" thickness="4px" size="xl" />}
            <Image ref={ref} display={loaded ? 'inline' : 'none'} draggable={false} />
        </>
    );
}
