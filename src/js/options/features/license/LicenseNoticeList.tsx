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
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    chakra,
    Code,
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';

import { useDispatch } from '../../store';
import { fetchLicenses, selectLicenses } from './licenseSlice';

const LicenseNoticeList: React.FC = () => {
    const dispatch = useDispatch();
    const licenses = useSelector(selectLicenses);

    React.useEffect(() => {
        dispatch(fetchLicenses());
    }, [dispatch]);

    return (
        <Accordion allowMultiple>
            {licenses.map(l => (
                <AccordionItem key={l.name}>
                    <h2>
                        <AccordionButton>
                            <Box flex={1} textAlign="left">{l.name}</Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel>
                        <Code w="100%">
                            <chakra.pre p="1em" whiteSpace="pre-wrap">{l.license}</chakra.pre>
                        </Code>
                    </AccordionPanel>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export default LicenseNoticeList;
