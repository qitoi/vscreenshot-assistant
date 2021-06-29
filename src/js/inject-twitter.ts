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

(function () {
    document.addEventListener('paste-screenshot', e => {
        share((e as CustomEvent).detail as File[]);
    });

    function share(files: File[]) {
        const event = new DummyDragEvent('drop', new DummyDataTransfer(files), { bubbles: true, cancelable: true });
        const dropArea = document.querySelector('div.public-DraftEditor-content');
        dropArea.dispatchEvent(event);
    }

    class DummyDragEvent<T = any> extends CustomEvent<T> {
        public readonly dataTransfer;

        constructor(typeArg: string, dataTransfer: DataTransfer, eventInitDict?: CustomEventInit<T>) {
            super(typeArg, eventInitDict);
            this.dataTransfer = dataTransfer;
        }
    }

    function DummyDataTransfer(files) {
        this.dropEffect = 'none';
        this.effectAllowed = 'all';
        this.files = files;
        this.items = files.map(f => ({ kind: 'file', type: f.type }));
        this.types = ['Files'];
    }

    DummyDataTransfer.prototype.clearData = (format) => {
    };
    DummyDataTransfer.prototype.getData = (format) => {
    };
    DummyDataTransfer.prototype.setData = (format, data) => {
    };
    DummyDataTransfer.prototype.setDragImage = (element, xOffset, yOffset) => {
    };
})();
