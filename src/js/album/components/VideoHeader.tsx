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
import {
    Box,
    Center,
    HStack,
    IconButton,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Progress,
    Select,
    Spacer,
    Text,
    useBoolean,
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon, HamburgerIcon, LockIcon } from '@chakra-ui/icons';
import { CancelError } from 'p-cancelable';

import platforms from '../../lib/platforms';
import { ScreenshotSortOrder, ScreenshotSortOrders } from '../lib/ScreenshotSort';
import useArchive from '../hooks/useArchive';
import { useDispatch, useSelector } from '../stores/store';
import { selectScreenshotSortOrder, setSortOrder } from '../stores/screenshotSlice';
import { removeVideo, selectActiveVideo } from '../stores/videoSlice';

import DownloadDialog from './DownloadDialog';
import Dialog from './Dialog';
import { setActiveVideo } from '../stores/activeVideoAction';

export default function VideoHeader() {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);
    const order = useSelector(selectScreenshotSortOrder);

    const [isDeleteOpen, setIsDeleteOpen] = useBoolean(false);

    const [archive, cancel, setProgressHandler] = useArchive();
    const [isDownloadOpen, setIsDownloadOpen] = useBoolean(false);
    const [isDeletingVideo, setIsDeletingVideo] = useBoolean(false);

    const handleChangeSortOrder = e => {
        const order = (+e.target.value) as ScreenshotSortOrder;
        dispatch(setSortOrder({ order: order }));
    };

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

    return (
        <Box h="5em" p="1em" fontSize="lg" lineHeight="1.5em" bg="teal.500" color="white">
            <HStack h="3em">
                {video !== null &&
                <Box w="100%" overflow="hidden">
                    <HStack w="100%" spacing={1}>
                        {video.private && <LockIcon boxSize="1em" color="yellow.400" />}
                        <Link href={platforms.getVideoURL(video.platform, video.videoId)} isExternal={true}
                              whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                            {video.title} / {video.author}
                        </Link>
                    </HStack>
                    <Box>{(new Date(video.date)).toDateString()}</Box>
                </Box>
                }
                <Spacer />
                <Box flexShrink={0}>
                    <Select onChange={handleChangeSortOrder}>
                        {Object.entries(ScreenshotSortOrders).map(([val, label]) => (
                            <option style={{ color: 'black' }} selected={+val === order} value={val}>{label}</option>
                        ))}
                    </Select>
                </Box>
                <Box fontSize="md" color="black">
                    <Menu>
                        <MenuButton
                            as={IconButton}
                            rounded="md"
                            icon={<HamburgerIcon color="gray.500" />} />
                        <MenuList>
                            <MenuItem isDisabled={video === null} icon={<DownloadIcon />} onClick={handleDownload}>ダウンロード</MenuItem>
                            <MenuItem isDisabled={video === null} icon={<DeleteIcon />} onClick={handleDeleteConfirm}>削除</MenuItem>
                        </MenuList>
                    </Menu>
                </Box>
            </HStack>

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
        </Box>
    );
}
