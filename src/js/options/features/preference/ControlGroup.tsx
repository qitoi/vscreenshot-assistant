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
import { Box, FormControl, FormControlProps, FormLabel, useFormControlContext, VStack } from '@chakra-ui/react';

type ControlGroupProps = Omit<FormControlProps, 'label'> & {
    label?: React.ReactElement,
    isEnabledHover?: boolean,
};

const ControlGroup: React.FC<ControlGroupProps> = ({ label, isEnabledHover, children, ...rest }: ControlGroupProps) => {
    const context = useFormControlContext();
    const isNested = (context !== undefined);
    const hover = (isEnabledHover === true) ? { transition: 'background ease-out 200ms', _hover: { background: 'blackAlpha.50' } } : {};
    const padding = isNested ? {} : { px: '1em' };
    return (
        <FormControl fontSize="md" w="100%" {...hover} {...padding} {...rest}>
            {label
                ? (
                    <VStack spacing={0}>
                        <FormLabel w="100%" m={0} paddingTop="1em" paddingBottom="0.5em">{label}</FormLabel>
                        <Box w="100%" paddingLeft="2em">
                            {children}
                        </Box>
                    </VStack>
                )
                : <>{children}</>
            }
        </FormControl>
    );
};

export default ControlGroup;
