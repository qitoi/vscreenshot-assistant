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


import { ImageDataUrl } from './types';

export function downloadImage(url: string, noCors: boolean): Promise<ImageDataUrl> {
    const mode = noCors ? 'no-cors' : 'cors';
    return new Promise<ImageDataUrl>((resolve, reject) => {
        fetch(url, { mode })
            .then(res => {
                if (res.status === 0) {
                    throw new Error('download error');
                }
                return res.blob();
            })
            .then(body => {
                const reader = new FileReader();
                reader.readAsDataURL(body);
                reader.onload = () => {
                    resolve(reader.result as ImageDataUrl);
                };
            })
            .catch(reject);
    });
}
