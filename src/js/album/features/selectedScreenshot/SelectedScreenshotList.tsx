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
import { Box, Button, Center, Flex, Grid, HStack, Progress, StackProps, Text, useBoolean } from '@chakra-ui/react';

import { getScreenshotKey, ScreenshotInfo, VideoInfo } from '../../../libs/types';
import { LocalizedText } from '../../../components/LocalizedText';
import * as client from '../../../messages/client';
import { useDispatch, useSelector } from '../../store';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { selectThumbnailPreferences } from '../preferences/preferencesSlice';
import { selectHashtags } from '../activeVideo/activeVideoSlice';
import { clearSelectedScreenshot, ScreenshotInfoWithThumbnail, selectScreenshotSelectMode, setScreenshotSelectMode } from './selectedScreenshotSlice';
import { SelectedScreenshot } from './SelectedScreenshot';
import Dialog from "../../../components/Dialog";
import { removeScreenshot } from "../screenshot/screenshotSlice";

type SelectedScreenshotListProps = {
    video: VideoInfo;
    screenshots: ScreenshotInfoWithThumbnail[];
    onResize: (width: number, height: number) => void;
    onClick: (info: ScreenshotInfo) => void;
} & Omit<StackProps, 'onResize' | 'onClick'>;

const SelectedScreenshotList = ({ video, screenshots, onResize, onClick, ...stackProps }: SelectedScreenshotListProps) => {
    const dispatch = useDispatch();
    const [loaded, setLoaded] = useBoolean(false);
    const ref = useResizeObserver<HTMLDivElement>(onResize);
    const thumbPrefs = useSelector(selectThumbnailPreferences);
    const hashtags = useSelector(selectHashtags);
    const selectMode = useSelector(selectScreenshotSelectMode);

    const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);
    const [isDeletingScreenshot, setIsDeletingScreenshot] = React.useState<boolean>(false);

    const handleLoad = () => {
        setLoaded.on();
    };

    const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await client.sendMessage('share-screenshot', { video, screenshots, hashtags });
    };

    const handleDeleteSelectCancel = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        dispatch(setScreenshotSelectMode({ mode: 'share' }));
    };

    const handleDeleteConfirm = () => {
        setIsDeleteOpen(true);
    };

    const handleDeleteCancel = () => {
        setIsDeleteOpen(false);
    };

    const handleDelete = async () => {
        if (video !== null) {
            setIsDeletingScreenshot(true);
            const no = screenshots.map(s => s.no);
            await dispatch(removeScreenshot({ platform: video.platform, videoId: video.videoId, no: no, removeFromStorage: true }));
        }
        setIsDeleteOpen(false);
        setIsDeletingScreenshot(false);
        dispatch(clearSelectedScreenshot());
    };

    if (selectMode === 'share' && screenshots.length === 0) {
        return null;
    }

    return (
        <HStack
            {...stackProps}
            ref={ref}
            alignItems="stretch"
            justifyContent="center"
            visibility={(selectMode === 'delete' || loaded) ? 'visible' : 'hidden'}
            bg={(selectMode === 'share') ? "gray.300" : "gray.400"}
            gap={4}>
            <Grid gridTemplateColumns={`repeat(4, minmax(${thumbPrefs.width / 4}px, ${thumbPrefs.width}px))`}
                  gap={2}
                  flexWrap="nowrap"
                  justifyContent="center">
                {screenshots.map(s =>
                    <SelectedScreenshot
                        key={getScreenshotKey(s)}
                        info={s}
                        screenshot={s.thumbnail}
                        onLoad={handleLoad}
                        onClick={onClick} />
                )}
            </Grid>
            <Flex w="8em" flexDir="column" justifyContent="flex-end" gap={2}>
            {selectMode === 'share' ? (
                <Button
                    key="tweet"
                    onClick={handleShare}
                    color="white"
                    bgColor="rgb(29, 155, 240)"
                    _hover={{ backgroundColor: 'rgb(26, 140, 216)' }}
                    _active={{ backgroundColor: 'rgb(23, 124, 192)' }}>
                    <LocalizedText messageId="album_tweet_screenshot_button" />
                </Button>
            ) : (
                <>
                    <Button
                        key="delete"
                        onClick={handleDeleteConfirm}
                        colorScheme="red">
                        <LocalizedText messageId="album_delete_screenshot_button" />
                    </Button>
                    <Button
                        key="cancel"
                        onClick={handleDeleteSelectCancel}
                        colorScheme="gray">
                        <LocalizedText messageId="album_cancel_screenshot_button" />
                    </Button>
                </>
            )}
            </Flex>

            <Dialog isOpen={isDeleteOpen}
                    okLabel={<LocalizedText messageId="album_delete_button" />}
                    cancelLabel={<LocalizedText messageId="album_cancel_button" />}
                    isButtonDisabled={isDeletingScreenshot}
                    onOK={handleDelete}
                    onCancel={handleDeleteCancel}>
                {!isDeletingScreenshot
                    ? (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="album_select_delete_confirm_label" /></Text></Center>
                        </Box>
                    ) : (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="album_deleting_label" /></Text></Center>
                            <Progress isIndeterminate />
                        </Box>
                    )
                }
            </Dialog>
        </HStack>
    );
};

export default React.memo(SelectedScreenshotList);
