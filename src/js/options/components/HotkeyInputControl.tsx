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
import { Input, InputProps, useMergeRefs } from '@chakra-ui/react';
import { useController, useFormContext } from 'react-hook-form';
import hotkeys, { KeyHandler } from 'hotkeys-js';

import { TypedFieldPath } from './TypedFieldPath';

function codeToKeyName(code: string): string {
    if (code.startsWith('Key') && code.length === 4) {
        return code[3].toLowerCase();
    }
    if (code.startsWith('Allow') || code.startsWith('Digit')) {
        return code.substring(5).toLowerCase();
    }
    const keymap: Record<string, string> = {
        Minus: '-',
        Equal: '=',
        BracketLeft: '[',
        BracketRight: ']',
        Enter: 'enter',
        Semicolon: ';',
        Quote: '\'',
        Backquote: '`',
        Backslash: '\\',
        Comma: ',',
        Period: '.',
        Slash: '/',
        Space: 'space',
    };
    if (code in keymap) {
        return keymap[code];
    }
    if (/^F\d+$/.test(code)) {
        return code.toLowerCase();
    }
    return '';
}

type HotkeyInputControlProps<T> = Omit<InputProps, 'ref' | 'name'> & {
    name: TypedFieldPath<T, string>,
};

const HotkeyInputControl = <T, >({ name, ...rest }: HotkeyInputControlProps<T>): React.ReactElement => {
    const { control, setValue } = useFormContext<T>();
    const { field: { ref: fieldRef, ...field } } = useController({ name, control });
    const handlerRef = React.useRef<KeyHandler | null>(null);

    const hotkeyRef = React.useCallback((node: HTMLInputElement) => {
        if (node === null && handlerRef.current !== null) {
            hotkeys.unbind('*', handlerRef.current);
        }
        else {
            handlerRef.current = e => {
                if (e.target !== node) {
                    return;
                }
                const keys: string[] = [];
                if (hotkeys.command) {
                    keys.push('command');
                }
                if (hotkeys.ctrl) {
                    keys.push('ctrl');
                }
                if (hotkeys.alt) {
                    keys.push('alt');
                }
                if (hotkeys.shift) {
                    keys.push('shift');
                }
                const key = codeToKeyName(e.code);
                if (key !== '') {
                    keys.push(key);
                    setValue(name, (keys.join('+')) as any, { shouldDirty: true });
                }
            };
            hotkeys.filter = () => true;
            hotkeys('*', { element: node }, handlerRef.current);
        }
    }, [name, setValue]);

    const refs = useMergeRefs(hotkeyRef, fieldRef);

    return (
        <Input ref={refs} {...field} {...rest} readOnly />
    );
};

export default HotkeyInputControl;
