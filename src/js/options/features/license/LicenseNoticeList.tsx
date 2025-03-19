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

import { LocalizedText } from '../../../components/LocalizedText';


type LicenseNotice = {
    name: string;
    license: string;
};

function parseLicenseNotices(text: string): LicenseNotice[] {
    const split = text.split('\n------------------------------\n');
    split.shift();
    const notices: LicenseNotice[] = [];
    while (split.length > 0) {
        const name = split.shift()?.trim();
        let license = split.shift();
        if (name === undefined || license === undefined) {
            break;
        }
        license = license.substring(1, license.length - 1);
        notices.push({ name, license });
    }
    return notices;
}


const LicenseNoticeList: React.FC = () => {
    const [notices, setNotices] = React.useState<LicenseNotice[]>([]);

    React.useEffect(() => {
        fetch(chrome.runtime.getURL('THIRD-PARTY-NOTICES'))
            .then(async res => {
                const text = await res.text();
                const notices = parseLicenseNotices(text);
                setNotices(notices);
            });
    }, []);

    return (
        <Box maxW="50em" py="4em" mx="auto">
            <Box fontSize="md" px="1em" paddingBottom="1em">
                <LocalizedText messageId="license_third_party_notices" />
            </Box>
            <Accordion allowMultiple>
                {notices.map(notice => (
                    <AccordionItem key={notice.name}>
                        <h2>
                            <AccordionButton>
                                <Box flex={1} textAlign="left">{notice.name}</Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel>
                            <Code w="100%">
                                <chakra.pre p="1em" whiteSpace="pre-wrap">{notice.license}</chakra.pre>
                            </Code>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
        </Box>
    );
};

export default LicenseNoticeList;
