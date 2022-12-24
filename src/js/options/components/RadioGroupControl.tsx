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
import { RadioGroup, RadioGroupProps } from '@chakra-ui/react';
import { useController, useFormContext, FieldValues } from 'react-hook-form';

import { TypedFieldPath } from './TypedFieldPath';

type ValueType = string | number;

type RadioGroupControlProps<T extends FieldValues> = Omit<RadioGroupProps, 'name'> & {
    name: TypedFieldPath<T, ValueType>,
};

const RadioGroupControl = <T extends FieldValues, >({ name, children, ...rest }: RadioGroupControlProps<T>): React.ReactElement => {
    const { control, getValues } = useFormContext<T>();
    const { field: { value, onChange, ...fieldRest } } = useController<T, typeof name>({ name, control });
    const type = typeof getValues(name);
    const handleChange = React.useCallback((nextValue: string) => {
        if (type === 'number') {
            onChange(+nextValue);
        }
        else {
            onChange('' + nextValue);
        }
    }, [onChange, type]);
    return (
        <RadioGroup paddingLeft="2em" {...rest} {...fieldRest} value={"" + (value as ValueType)} onChange={handleChange}>
            {children}
        </RadioGroup>
    );
};

export default RadioGroupControl;
