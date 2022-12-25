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
import { Input, InputProps } from '@chakra-ui/react';
import { useController, useFormContext, FieldValues } from 'react-hook-form';

import * as hotkeys from '../../libs/hotkeys';
import { TypedFieldPath } from './TypedFieldPath';

type ValueType = hotkeys.KeyConfig;

type HotkeyInputControlProps<T extends FieldValues> = Omit<InputProps, 'name'> & {
    name: TypedFieldPath<T, ValueType>,
};

const HotkeyInputControl = <T extends FieldValues, >({ name, ...rest }: HotkeyInputControlProps<T>): React.ReactElement => {
    const { control, setValue } = useFormContext<T>();
    const { field: { value } } = useController({ name, control });

    const ref = React.useCallback((node: HTMLInputElement) => {
        if (node !== null) {
            node.addEventListener('keydown', e => {
                e.preventDefault();
                const config = hotkeys.getKeyConfigFromKeyboardEvent(e);
                if (config !== null) {
                    setValue(name, config as any, { shouldDirty: true });
                }
            });
        }
    }, [name, setValue]);

    return (
        <Input ref={ref} {...rest} value={hotkeys.getHotkeyString(value as ValueType)} readOnly />
    );
};

export default HotkeyInputControl;
