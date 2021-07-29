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
import { useController, useFormContext } from 'react-hook-form';
import {
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputProps,
    NumberInputStepper
} from '@chakra-ui/react';

import { TypedFieldPath } from './TypedFieldPath';

type NumberInputControlProps<T> = Omit<NumberInputProps, 'ref' | 'name' | 'onChange' | 'onBlur'> & {
    name: TypedFieldPath<T, number>,
};

export function NumberInputControl<T>({ ...rest }: NumberInputControlProps<T>) {
    const { control } = useFormContext<T>();
    const { field } = useController({ name: rest.name, control });
    const { ref, name, value, onChange, onBlur } = field;
    const handleChange = (valueAsString: string, valueAsNumber: number) => {
        if (!Number.isInteger(valueAsNumber)) {
            valueAsNumber = 0;
        }
        onChange({ target: { value: valueAsNumber } });
    };
    return (
        <NumberInput {...rest} ref={ref} name={name} value={value} onChange={handleChange} onBlur={onBlur}>
            <NumberInputField />
            <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper>
        </NumberInput>
    );
}
