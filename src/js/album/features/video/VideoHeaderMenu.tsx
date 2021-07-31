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
import { Box, Center, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Progress, Text, useBoolean } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FcEmptyTrash, FcDownload, FcSettings } from 'react-icons/fc';
import { CancelError } from 'p-cancelable';

import { useDispatch, useSelector } from '../../store';
import useArchive from '../../hooks/useArchive';
import Dialog from '../../components/Dialog';
import DownloadDialog from '../../components/DownloadDialog';
import { selectActiveVideo, setActiveVideo } from '../activeVideo/activeVideoSlice';
import { removeVideo } from './videoSlice';

export function VideoHeaderMenu() {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);

    const [isDeleteOpen, setIsDeleteOpen] = useBoolean(false);

    const [archive, cancel, setProgressHandler] = useArchive();
    const [isDownloadOpen, setIsDownloadOpen] = useBoolean(false);
    const [isDeletingVideo, setIsDeletingVideo] = useBoolean(false);

    const handleDeleteConfirm = () => {
        setIsDeleteOpen.on();
    };

    const handleDeleteCancel = () => {
        setIsDeleteOpen.off();
    };

    const handleDelete = async () => {
        if (video !== null) {
            setIsDeletingVideo.on();
            await dispatch(removeVideo({ platform: video.platform, videoId: video.videoId }));
            dispatch(setActiveVideo(null));
        }
        setIsDeleteOpen.off();
        setIsDeletingVideo.off();
    };

    const handleDownload = React.useCallback(async e => {
        setIsDownloadOpen.on();

        if (video === null) {
            return;
        }

        try {
            const zipBlob = await archive(video.platform, video.videoId);
            const a = document.createElement('a') as HTMLAnchorElement;
            a.href = URL.createObjectURL(zipBlob);
            a.download = 'images.zip';
            a.click();
        }
        catch (e) {
            if (!(e instanceof CancelError)) {
                alert(e);
            }
        }

        setIsDownloadOpen.off();
    }, [archive, video]);

    const handleDownloadCancel = React.useCallback(() => {
        cancel();
        setIsDownloadOpen.off();
    }, [cancel]);

    const handleOpenOptions = React.useCallback(() => {
        chrome.runtime.openOptionsPage();
    }, []);

    return (
        <>
            <Menu>
                <MenuButton
                    as={IconButton}
                    rounded="md"
                    icon={<HamburgerIcon color="gray.500" />} />
                <MenuList>
                    <MenuItem isDisabled={video === null} icon={<FcDownload size="1.5em" />} onClick={handleDownload}>ダウンロード</MenuItem>
                    <MenuItem isDisabled={video === null} icon={<FcEmptyTrash size="1.5em" />} onClick={handleDeleteConfirm}>削除</MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<FcSettings size="1.5em" />} onClick={handleOpenOptions}>設定</MenuItem>
                </MenuList>
            </Menu>

            <Dialog isOpen={isDeleteOpen}
                    okLabel="削除"
                    cancelLabel="キャンセル"
                    isButtonDisabled={isDeletingVideo}
                    onOK={handleDelete}
                    onCancel={handleDeleteCancel}>
                {!isDeletingVideo
                    ? (
                        <Box>
                            <Center><Text py="1em">スクリーンショットを削除しますか？</Text></Center>
                        </Box>
                    ) : (
                        <Box>
                            <Center><Text py="1em">スクリーンショットを削除しています</Text></Center>
                            <Progress isIndeterminate />
                        </Box>
                    )
                }
            </Dialog>

            <DownloadDialog isOpen={isDownloadOpen} onCancel={handleDownloadCancel} setProgressHandler={setProgressHandler} />
        </>
    );
}
