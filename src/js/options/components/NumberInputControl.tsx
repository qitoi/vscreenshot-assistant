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
    Box,
    HStack,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputProps,
    NumberInputStepper,
} from '@chakra-ui/react';

import { TypedFieldPath } from './TypedFieldPath';

type ValueType = number;

type NumberInputControlProps<T> = Omit<NumberInputProps, 'name'> & {
    name: TypedFieldPath<T, ValueType>,
    unit?: string,
};

const NumberInputControl = <T, >({ unit, ...rest }: NumberInputControlProps<T>): React.ReactElement => {
    const { control } = useFormContext<T>();
    const { field: { value, onChange, ...fieldRest } } = useController({ name: rest.name, control });
    const handleChange = React.useCallback((valueAsString: string, valueAsNumber: number) => {
        if (!Number.isInteger(valueAsNumber)) {
            valueAsNumber = 0;
        }
        onChange({ target: { value: valueAsNumber } });
    }, [onChange]);
    return (
        <HStack w={rest.w} width={rest.width}>
            <NumberInput {...rest} {...fieldRest} value={value as ValueType} onChange={handleChange} flexShrink={1}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
            {unit && (<Box w={`${unit.length}em`} flexShrink={0}>{unit}</Box>)}
        </HStack>
    );
};

export default NumberInputControl;
