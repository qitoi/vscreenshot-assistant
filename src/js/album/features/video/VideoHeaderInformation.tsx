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
import { Box, CheckboxGroup, HStack, Link } from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';

import * as platforms from '../../../lib/platforms';
import { getVideoKey } from '../../../lib/types';
import * as datetime from '../../../lib/datetime';
import { useDispatch, useSelector } from '../../store';
import { HashtagCheckbox } from '../../components/HashtagCheckbox';
import { selectActiveVideo, selectHashtags, setHashtags } from '../activeVideo/activeVideoSlice';
import { selectHashtagEnabled } from '../preferences/preferencesSlice';

const VideoHeaderInformation: React.FC = () => {
    const dispatch = useDispatch();
    const video = useSelector(selectActiveVideo);
    const selectedHashtags = useSelector(selectHashtags);
    const hashtagEnabled = useSelector(selectHashtagEnabled);
    const videoKey = video ? getVideoKey(video) : '';

    const handleSelectedHashtagsChange = React.useCallback((value: string[]) => {
        if (video !== null) {
            dispatch(setHashtags({ video, hashtags: value }));
        }
    }, [dispatch, video]);

    if (video === null) {
        return null;
    }

    const date = datetime.format(video.date);

    return (
        <Box w="100%" overflow="hidden">
            <HStack w="100%" spacing={1}>
                {video.private && <LockIcon boxSize="1em" color="yellow.400" />}
                <Link href={platforms.getVideoUrl(video.platform, video.videoId)} isExternal={true}
                      whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                    {video.title} / {video.author}
                </Link>
            </HStack>
            <HStack>
                <Box whiteSpace="nowrap">
                    {date}
                </Box>
                {hashtagEnabled && video && video.hashtags && video.hashtags.length > 0 && (
                    <CheckboxGroup key={videoKey} value={selectedHashtags} onChange={handleSelectedHashtagsChange}>
                        <HStack>
                            {video.hashtags.map(hashtag => (
                                <HashtagCheckbox
                                    key={hashtag}
                                    value={hashtag}
                                    checkedColor="rgba(255, 255, 255, 1)"
                                    uncheckedColor="rgba(200, 200, 200, 0.8)">
                                    #{hashtag}
                                </HashtagCheckbox>
                            ))}
                        </HStack>
                    </CheckboxGroup>
                )}
            </HStack>
        </Box>
    );
};

export default VideoHeaderInformation;
