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

import * as twitterMessage from './libs/twitter-message';

(function () {
    // コンテンツスクリプトからのファイル受信
    window.addEventListener('message', (() => {
        const handler = (e: MessageEvent) => {
            const files = twitterMessage.receiveFiles(e);
            if (files !== null) {
                window.removeEventListener('message', handler);
                share(e.data.files as File[]);
            }
        };
        return handler;
    })());

    function share(files: File[]) {
        const event = new DummyDragEvent('drop', new DummyDataTransfer(files) as any, { bubbles: true, cancelable: true });
        const dropArea = document.querySelector('div.public-DraftEditor-content') as HTMLElement;
        dropArea.dispatchEvent(event);
    }

    class DummyDragEvent<T = any> extends CustomEvent<T> {
        public readonly dataTransfer;

        constructor(typeArg: string, dataTransfer: DataTransfer, eventInitDict?: CustomEventInit<T>) {
            super(typeArg, eventInitDict);
            this.dataTransfer = dataTransfer;
        }
    }

    class DummyDataTransfer {
        dropEffect = 'none';
        effectAllowed = 'all';
        types = ['Files'];
        files: File[];
        items: { kind: string; type: string }[];

        constructor(files: File[]) {
            this.files = files;
            this.items = files.map(f => ({ kind: 'file', type: f.type }));
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clearData(format?: string): void {
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getData(format: string): string {
            return '';
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setData(format: string, data: string): void {
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setDragImage(image: Element, xOffset: number, yOffset: number): void {
        }
    }
})();
