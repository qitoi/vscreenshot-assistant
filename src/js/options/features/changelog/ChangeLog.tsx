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
import { Box } from '@chakra-ui/react';
import Markdown from 'markdown-to-jsx';
import { css } from '@emotion/react';


const style = css`
h1 {
    font-size: var(--chakra-fontSizes-3xl);
    font-weight: bold;
    padding-bottom: 0.5em;
    padding-left: 1rem;
    border-bottom: 2px solid;
    border-color: var(--chakra-colors-gray-400);
}
h2 {
    font-size: var(--chakra-fontSizes-2xl);
    font-weight: bold;
    padding-top: 2em;
    padding-bottom: 0.5rem;
    padding-left: 2rem;
    border-bottom: 2px solid;
    border-color: var(--chakra-colors-gray-300);
}
h3 {
    font-size: var(--chakra-fontSizes-xl);
    font-weight: bold;
    padding-top: 1em;
    padding-bottom: 0.5rem;
    padding-left: 3rem;
    border-bottom: 2px solid;
    border-color: var(--chakra-colors-gray-200);
}
ul {
    padding-left: 5rem;
    padding-top: 1em;
    padding-bottom: 1em;
}
`;


const ChangeLog: React.FC = () => {
    const [changeLog, setChangeLog] = React.useState<string>('');

    React.useEffect(() => {
        fetch(chrome.runtime.getURL('CHANGELOG.md'))
            .then(async res => {
                const text = await res.text();
                setChangeLog(text);
            });
    }, []);

    return (
        <Box maxW="56em" py="4em" mx="auto" fontSize="md" css={style}>
            <Markdown>
                {changeLog}
            </Markdown>
        </Box>
    );
};

export default ChangeLog;
