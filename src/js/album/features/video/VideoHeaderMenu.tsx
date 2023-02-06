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

import { getVideoKey, VideoInfo } from '../../../libs/types';
import * as storage from '../../../libs/storage';
import * as prefs from '../../../libs/prefs';
import { decodeDataURL } from '../../../libs/data-url';
import { LocalizedText } from '../../../components/LocalizedText';
import { useDispatch, useSelector } from '../../store';
import useArchive from '../../hooks/useArchive';
import Dialog from '../../../components/Dialog';
import DownloadDialog from '../../components/DownloadDialog';
import CustomLightbox, { CustomLightboxSource } from '../../components/Lightbox/CustomLightbox';
import { selectActiveVideo } from '../activeVideo/activeVideoSlice';
import { removeVideo } from './videoSlice';

const VideoHeaderMenu: React.FC = () => {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);

    const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

    const [archive, cancel, setProgressHandler] = useArchive();
    const [isDownloadOpen, setIsDownloadOpen] = React.useState<boolean>(false);
    const [isDeletingVideo, setIsDeletingVideo] = React.useState<boolean>(false);
    const [thumbnailVideo, setThumbnailVideo] = React.useState<VideoInfo[]>([]);
    const lightboxSource = React.useMemo<CustomLightboxSource[]>(() => thumbnailVideo.map(v => ({
        key: getVideoKey(v),
        load: async () => {
            const image = await storage.getVideoThumbnail(v.platform, v.videoId);
            return image ? decodeDataURL(image) : null;
        },
    })), [thumbnailVideo]);

    const handleDeleteConfirm = () => {
        setIsDeleteOpen(true);
    };

    const handleDeleteCancel = () => {
        setIsDeleteOpen(false);
    };

    const handleDelete = async () => {
        if (video !== null) {
            setIsDeletingVideo(true);
            await dispatch(removeVideo({ platform: video.platform, videoId: video.videoId, removeFromStorage: true }));
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
            const p = await prefs.loadPreferences();
            await archive(video, p.general.filesPerArchive, (zip, index, max) => {
                const a = document.createElement('a') as HTMLAnchorElement;
                const url = URL.createObjectURL(zip);
                const filename = (video.title !== '') ? video.title : 'images';
                const suffix = (max === 1) ? '' : `_${index + 1}`;
                a.href = url;
                a.download = `${filename}${suffix}.zip`;
                a.click();
                URL.revokeObjectURL(url);
            });
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
    }, [cancel]);

    const handleShowThumbnail = React.useCallback(() => {
        if (video !== null) {
            setThumbnailVideo([video]);
        }
    }, [video]);
    const handleCloseThumbnail = React.useCallback(() => setThumbnailVideo([]), []);

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
                    list={lightboxSource}
                    index={0}
                    open={true}
                    loop={false}
                    onClose={handleCloseThumbnail} />
            )}
        </>
    );
};

export default VideoHeaderMenu;
