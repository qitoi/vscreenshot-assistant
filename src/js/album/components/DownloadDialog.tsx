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

import * as React from 'react';
import { Center, Progress } from '@chakra-ui/react';

import { SetProgressHandler } from '../hooks/useArchive';
import Dialog from './Dialog';

type DownloadDialogProps = {
    isOpen: boolean,
    onCancel: () => void,
    setProgressHandler: SetProgressHandler,
};

const DownloadDialog = React.memo(({ isOpen, onCancel, setProgressHandler }: DownloadDialogProps) => {
    return (
        <Dialog isOpen={isOpen} cancelLabel="キャンセル" onCancel={onCancel}>
            <Center py="1em">ダウンロード準備中 ...</Center>
            <ProgressBar setProgressHandler={setProgressHandler} />
        </Dialog>
    );
});

type ProgressBarProps = {
    setProgressHandler: SetProgressHandler,
};

const ProgressBar = React.memo(({ setProgressHandler }: ProgressBarProps) => {
    const [progress, setProgress] = React.useState<number>(0);
    const handleProgress = React.useCallback((p: number) => {
        setProgress(p);
    }, []);

    setProgressHandler(handleProgress);

    return (
        <Progress value={progress} max={100} />
    );
});

export default DownloadDialog;
