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
import { FormLabel, FormLabelProps, HStack, Spacer } from '@chakra-ui/react';

type LabeledControlProps = FormLabelProps & {
    label: React.ReactElement,
};

const LabeledControl = ({ label, children, ...rest }: LabeledControlProps) => {
    const padding = { py: '0.5em' };
    return (
        <FormLabel w="100%" m={0} {...padding} {...rest}>
            <HStack minH={10}>
                {label}
                <Spacer />
                {children}
            </HStack>
        </FormLabel>
    );
};

export default LabeledControl;
