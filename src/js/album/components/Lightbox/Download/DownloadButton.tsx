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
import { MdFileDownload } from 'react-icons/md';
import { IconButton, useLightboxState } from 'yet-another-react-lightbox/core'
import { Slide } from 'yet-another-react-lightbox';

type DownloadButtonProps = {
    slides: Slide[];
};

export function DownloadButton({ slides }: DownloadButtonProps) {
    const { state: { currentIndex } } = useLightboxState();
    const [enabled, setEnabled] = React.useState<boolean>(false);
    const slide = slides[currentIndex];

    React.useEffect(() => {
        setEnabled(slide && (slide.getImage !== undefined));
    }, [slide]);

    const handleClick = React.useCallback(async () => {
        if (slide) {
            const image = await slide.getImage?.();
            if (image) {
                const a = document.createElement('a');
                const objURL = URL.createObjectURL(image.blob);
                a.href = objURL;
                a.download = image.name;
                a.click();
                URL.revokeObjectURL(objURL);
            }
        }
    }, [slide]);

    return (
        <IconButton
            key="download"
            label="Download"
            disabled={!enabled}
            icon={MdFileDownload}
            onClick={handleClick} />
    );
}
