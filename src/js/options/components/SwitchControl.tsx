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
import { Switch, useFormControlProps } from '@chakra-ui/react';
import { useController, useFormContext } from 'react-hook-form';

import { TypedFieldPath } from './TypedFieldPath';

type SwitchControlProps<T> = {
    name: TypedFieldPath<T, boolean>,
};

const SwitchControl = <T, >({ name }: SwitchControlProps<T>): React.ReactElement => {
    const { control } = useFormContext<T>();
    const { field } = useController<T>({ name, control });
    const input = useFormControlProps<HTMLInputElement>(field);
    return (
        <Switch
            ref={field.ref}
            {...input}
            isChecked={field.value as boolean} />
    );
};

export default SwitchControl;
