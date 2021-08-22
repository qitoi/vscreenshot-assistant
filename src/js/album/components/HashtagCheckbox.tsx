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
import { chakra, forwardRef, HTMLChakraProps, PropsOf, ThemingProps } from '@chakra-ui/system';
import { callAll, Omit } from '@chakra-ui/utils';
import { Checkbox, Tag, useCheckboxGroupContext, useCheckbox, UseCheckboxProps, TagProps } from '@chakra-ui/react';
import { motion } from 'framer-motion';


const MotionTag = motion<Omit<TagProps, 'transition'>>(Tag);


const Label = chakra('label', {
    baseStyle: {
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'top',
        position: 'relative',
        _disabled: {
            cursor: 'not-allowed',
        },
    },
});

type CheckboxControlProps = Omit<HTMLChakraProps<'div'>, keyof UseCheckboxProps>

type BaseInputProps = Pick<PropsOf<'input'>, 'checked' | 'defaultChecked'>

export interface CheckboxProps
    extends CheckboxControlProps,
        BaseInputProps,
        ThemingProps<'Tag'>,
        UseCheckboxProps {
    checkedColor: string,
    uncheckedColor: string,
}


export const HashtagCheckbox = forwardRef<CheckboxProps, 'input'>((props, ref) => {
    const group = useCheckboxGroupContext();
    const mergedProps = { ...group, ...props } as CheckboxProps;

    const {
        children,
        isChecked: isCheckedProp,
        isDisabled = group?.isDisabled,
        onChange: onChangeProp,
        checkedColor,
        uncheckedColor,
        ...rest
    } = mergedProps;

    let isChecked = isCheckedProp;
    if (group?.value && mergedProps.value) {
        isChecked = group.value.includes(mergedProps.value);
    }

    let onChange = onChangeProp;
    if (group?.onChange && mergedProps.value) {
        onChange = callAll(group.onChange, onChangeProp);
    }

    const {
        state,
        getInputProps,
    } = useCheckbox({
        ...rest,
        isDisabled,
        isChecked,
        onChange,
    });

    const variants = {
        select: { backgroundColor: checkedColor },
        unselect: { backgroundColor: uncheckedColor },
    };

    return (
        <Label>
            <chakra.input display="none" {...getInputProps({}, ref)} />
            {children && (
                <MotionTag
                    bgColor={isChecked ? checkedColor : uncheckedColor}
                    rounded="1em"
                    borderColor="gray.400"
                    borderWidth="1px"
                    whiteSpace="nowrap"
                    whileHover={{ filter: 'brightness(90%)' }}
                    variants={variants}
                    animate={state.isChecked ? 'select' : 'unselect'}
                    transition={{ ease: 'easeOut', duration: 0.1 }}>
                    {children}
                </MotionTag>
            )}
        </Label>
    );
});
