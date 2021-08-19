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
import { Box, Center, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Progress, Text } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FcEmptyTrash, FcDownload, FcSettings, FcPicture } from 'react-icons/fc';
import { CancelError } from 'p-cancelable';

import { getVideoKey, VideoInfo } from '../../../lib/types';
import * as storage from '../../../lib/storage';
import { LocalizedText } from '../../../lib/components/LocalizedText';
import { useDispatch, useSelector } from '../../store';
import useArchive from '../../hooks/useArchive';
import Dialog from '../../components/Dialog';
import DownloadDialog from '../../components/DownloadDialog';
import { selectActiveVideo, setActiveVideo } from '../activeVideo/activeVideoSlice';
import { removeVideo } from './videoSlice';
import CustomLightbox from '../../components/CustomLightbox';

const VideoHeaderMenu: React.FC = () => {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);

    const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

    const [archive, cancel, setProgressHandler] = useArchive();
    const [isDownloadOpen, setIsDownloadOpen] = React.useState<boolean>(false);
    const [isDeletingVideo, setIsDeletingVideo] = React.useState<boolean>(false);
    const [thumbnailVideo, setThumbnailVideo] = React.useState<VideoInfo[]>([]);

    const handleDeleteConfirm = () => {
        setIsDeleteOpen(true);
    };

    const handleDeleteCancel = () => {
        setIsDeleteOpen(false);
    };

    const handleDelete = async () => {
        if (video !== null) {
            setIsDeletingVideo(true);
            await dispatch(removeVideo({ platform: video.platform, videoId: video.videoId }));
            dispatch(setActiveVideo(null));
        }
        setIsDeleteOpen(false);
        setIsDeletingVideo(false);
    };

    const handleDownload = React.useCallback(async () => {
        setIsDownloadOpen(true);

        if (video === null) {
            return;
        }

        try {
            const zipBlob = await archive(video.platform, video.videoId);
            const a = document.createElement('a') as HTMLAnchorElement;
            const zip = URL.createObjectURL(zipBlob);
            a.href = zip;
            a.download = 'images.zip';
            a.click();
            URL.revokeObjectURL(zip);
        }
        catch (e) {
            if (!(e instanceof CancelError)) {
                alert(e);
            }
        }

        setIsDownloadOpen(false);
    }, [archive, video]);

    const handleDownloadCancel = React.useCallback(() => {
        cancel();
        setIsDownloadOpen(false);
    }, [cancel]);

    const handleShowThumbnail = React.useCallback(() => {
        if (video !== null) {
            setThumbnailVideo([video]);
        }
    }, [video]);
    const handleCloseThumbnail = React.useCallback(() => setThumbnailVideo([]), []);
    const getKey = React.useCallback((v: VideoInfo) => getVideoKey(v), []);
    const loadImage = React.useCallback((v: VideoInfo) => storage.getVideoThumbnail(v.platform, v.videoId), []);

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
                    <MenuItem isDisabled={video === null} icon={<FcDownload size="1.5em" />} onClick={handleDownload}>
                        <LocalizedText messageId="album_menu_download" />
                    </MenuItem>
                    <MenuItem isDisabled={video === null} icon={<FcPicture size="1.5em" />} onClick={handleShowThumbnail}>
                        <LocalizedText messageId="album_menu_show_thumbnail" />
                    </MenuItem>
                    <MenuItem isDisabled={video === null} icon={<FcEmptyTrash size="1.5em" />} onClick={handleDeleteConfirm}>
                        <LocalizedText messageId="album_menu_delete" />
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<FcSettings size="1.5em" />} onClick={handleOpenOptions}>
                        <LocalizedText messageId="album_menu_preferences" />
                    </MenuItem>
                </MenuList>
            </Menu>

            <Dialog isOpen={isDeleteOpen}
                    okLabel={<LocalizedText messageId="album_delete_button" />}
                    cancelLabel={<LocalizedText messageId="album_cancel_button" />}
                    isButtonDisabled={isDeletingVideo}
                    onOK={handleDelete}
                    onCancel={handleDeleteCancel}>
                {!isDeletingVideo
                    ? (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="album_delete_confirm_label" /></Text></Center>
                        </Box>
                    ) : (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="album_deleting_label" /></Text></Center>
                            <Progress isIndeterminate />
                        </Box>
                    )
                }
            </Dialog>

            <DownloadDialog isOpen={isDownloadOpen} onCancel={handleDownloadCancel} setProgressHandler={setProgressHandler} />

            {thumbnailVideo.length > 0 && video !== null && (
                <CustomLightbox
                    list={thumbnailVideo}
                    initial={video}
                    loop={false}
                    getKey={getKey}
                    loadImage={loadImage}
                    onClose={handleCloseThumbnail} />
            )}
        </>
    );
};

export default VideoHeaderMenu;
