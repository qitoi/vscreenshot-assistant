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
import { chakra } from '@chakra-ui/system';
import { Omit } from '@chakra-ui/utils';
import { Tag, useCheckbox, UseCheckboxProps, TagProps, useCheckboxGroup, UseCheckboxGroupProps, HStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';


const MotionTag = motion<Omit<TagProps, 'transition'>>(Tag);

export interface CheckboxProps extends React.PropsWithChildren<UseCheckboxProps> {
    checkedColor: string,
    uncheckedColor: string,
}

export const HashtagCheckbox = (props: CheckboxProps) => {
    const { checkedColor, uncheckedColor, children, ...rest } = props;
    const { state, getInputProps, htmlProps } = useCheckbox(rest);

    const variants = {
        select: { backgroundColor: checkedColor },
        unselect: { backgroundColor: uncheckedColor },
    };

    return (
        <chakra.label {...htmlProps} cursor={state.isDisabled ? 'default' : 'pointer'}>
            <chakra.input type="checkbox" {...getInputProps()} />
            <MotionTag
                bgColor={(state.isChecked && !state.isDisabled) ? checkedColor : uncheckedColor}
                rounded="1em"
                borderColor="gray.400"
                borderWidth="1px"
                whiteSpace="nowrap"
                whileHover={{ filter: 'brightness(90%)' }}
                variants={variants}
                animate={(state.isChecked && !state.isDisabled) ? 'select' : 'unselect'}
                transition={{ ease: 'easeOut', duration: 0.1 }}>
                {children}
            </MotionTag>
        </chakra.label>
    );
};

export type HashtagCheckboxGroupProps = UseCheckboxGroupProps & { children: React.ReactElement[] };

export const HashtagCheckboxGroup = (props: HashtagCheckboxGroupProps) => {
    const { children, ...rest } = props;
    const { getCheckboxProps } = useCheckboxGroup(rest);

    return (
        <HStack>
            {React.Children.map(children, (child: React.ReactElement) => React.cloneElement(child, { ...getCheckboxProps(child.props) }))}
        </HStack>
    );
};
