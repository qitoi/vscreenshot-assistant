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

import { getLocalizedText } from '../../../lib/components/LocalizedText';
import { useDispatch, useSelector } from '../../store';
import { ScreenshotSortOrder, ScreenshotSortOrders } from '../../../lib/background/screenshot-sort';
import { fetchScreenshotSortOrder, selectScreenshotSortOrder, setScreenshotSortOrder } from './screenshotSlice';

const ScreenshotSortOrderSelect: React.FC = () => {
    const dispatch = useDispatch();
    const order = useSelector(selectScreenshotSortOrder);

    React.useEffect(() => {
        dispatch(fetchScreenshotSortOrder());
    }, [dispatch]);

    const screenshotSortOrderLabels = React.useMemo<Record<ScreenshotSortOrder, string>>(() => ({
        [ScreenshotSortOrders.VideoPosDesc]: getLocalizedText('album_screenshot_order_video_pos_desc'),
        [ScreenshotSortOrders.VideoPosAsc]: getLocalizedText('album_screenshot_order_video_pos_asc'),
        [ScreenshotSortOrders.CaptureDateDesc]: getLocalizedText('album_screenshot_order_capture_date_desc'),
        [ScreenshotSortOrders.CaptureDateAsc]: getLocalizedText('album_screenshot_order_capture_date_asc'),
    }), []);

    const handleChangeSortOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const order = (+e.target.value) as ScreenshotSortOrder;
        dispatch(setScreenshotSortOrder({ order: order }));
    };

    if (order === null) {
        return null;
    }

    return (
        <Select value={order} onChange={handleChangeSortOrder}>
            {Object.entries(screenshotSortOrderLabels).map(([val, label]) => (
                <option key={val} style={{ color: 'black' }} value={val}>
                    {label}
                </option>
            ))}
        </Select>
    );
};

export default ScreenshotSortOrderSelect;
