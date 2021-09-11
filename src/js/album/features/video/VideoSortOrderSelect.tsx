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
import { Select } from '@chakra-ui/react';

import { getLocalizedText } from '../../../lib/localize';
import { VideoSortOrder, VideoSortOrders } from '../../../lib/background/video-sort';
import { useDispatch, useSelector } from '../../store';
import { selectVideoSortOrder, setVideoSortOrder } from './videoSlice';

const VideoSortOrderSelect: React.FC = () => {
    const dispatch = useDispatch();
    const order = useSelector(selectVideoSortOrder);

    const videoSortOrderLabels = React.useMemo<Record<VideoSortOrder, string>>(() => ({
        [VideoSortOrders.LastUpdateDesc]: getLocalizedText('album_video_order_last_update_desc'),
        [VideoSortOrders.LastUpdateAsc]: getLocalizedText('album_video_order_last_update_asc'),
        [VideoSortOrders.VideoDateDesc]: getLocalizedText('album_video_order_video_date_desc'),
        [VideoSortOrders.VideoDateAsc]: getLocalizedText('album_video_order_video_date_asc'),
    }), []);

    const handleChangeSortOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const order: VideoSortOrder = +e.target.value as VideoSortOrder;
        dispatch(setVideoSortOrder({ order }));
    };

    if (order === null) {
        return null;
    }

    return (
        <Select value={order} onChange={handleChangeSortOrder}>
            {Object.entries(videoSortOrderLabels).map(([val, label]) => (
                <option key={val} style={{ color: 'black' }} value={val}>
                    {label}
                </option>
            ))}
        </Select>
    );
};

export default VideoSortOrderSelect;
