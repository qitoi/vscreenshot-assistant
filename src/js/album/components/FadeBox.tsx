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
import { Box, BoxProps } from "@chakra-ui/react";
import { motion } from 'framer-motion';

type FadeBoxProps = BoxProps & {
    show: boolean;
};
export const FadeBox: React.FC<FadeBoxProps> = ({ show, ...rest }: FadeBoxProps) => {
    const variants = {
        show: { opacity: 1 },
        hide: { opacity: 0 },
    };
    return (
        <Box
            as={motion.div}
            w="100%"
            h="100%"
            position="absolute"
            top={0}
            left={0}
            bgColor="rgba(0, 0, 0, 0.5)"
            opacity={0}
            variants={variants}
            animate={show ? 'show' : 'hide'}
            transition="0.1s easeOut"
            {...rest}
        />
    );
};
