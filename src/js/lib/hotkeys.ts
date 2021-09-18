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

type KeyModifier = {
    command: boolean,
    control: boolean,
    alt: boolean,
    shift: boolean,
};

export type KeyConfig = KeyModifier & {
    code: string,
    key: string,
};

export function isKeyConfig(value: any): value is KeyConfig {
    if (typeof value === 'object') {
        return (typeof value?.code === 'string') && (value.code !== '') &&
            (typeof value?.key === 'string') &&
            (typeof value?.command === 'boolean') &&
            (typeof value?.control === 'boolean') &&
            (typeof value?.alt === 'boolean') &&
            (typeof value?.shift === 'boolean');
    }
    return false;
}

export function getKeyConfig(code: string, config: Partial<KeyModifier>): KeyConfig {
    return {
        code: code,
        key: code,
        command: config.command ?? false,
        control: config.control ?? false,
        alt: config.alt ?? false,
        shift: config.shift ?? false,
    };
}

export function getKeyConfigFromKeyboardEvent(e: KeyboardEvent): KeyConfig | null {
    const code = normalizeCode(e.code);
    if (code === '') {
        return null;
    }
    const key = (e.key === ' ') ? 'Space' : e.key;
    return {
        code: code,
        key: key[0].toUpperCase() + key.slice(1),
        command: e.metaKey,
        control: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
    };
}

export function getHotkeyString(config: KeyConfig): string {
    const keys = [];
    if (config.command) {
        keys.push('Command');
    }
    if (config.control) {
        keys.push('Ctrl');
    }
    if (config.alt) {
        keys.push('Alt');
    }
    if (config.shift) {
        keys.push('Shift');
    }
    keys.push(config.key);
    return keys.join('+');
}

export type KeyDownHandler = (onKeyUp: Promise<void>) => void;

type UnbindFunc = () => void;

export function bindHotkey(element: HTMLElement | Window, config: KeyConfig, onKeyDown: KeyDownHandler): UnbindFunc {
    let onKeyUp: (() => void) | null = null;
    const keyDownListener: EventListener = e => {
        if (!(e instanceof KeyboardEvent)) {
            return;
        }
        if (e.repeat) {
            return;
        }

        if (onKeyUp !== null) {
            onKeyUp();
        }

        if (isMatchModifier(e, config) && isMatchCode(e, config)) {
            onKeyDown(new Promise<void>(resolve => {
                onKeyUp = resolve;
            }));
        }
    };
    const keyUpListener: EventListener = e => {
        if (!(e instanceof KeyboardEvent)) {
            return;
        }

        if (!isMatchModifier(e, config) || isMatchCode(e, config)) {
            if (onKeyUp !== null) {
                onKeyUp();
            }
        }
    };

    element.addEventListener('keydown', keyDownListener);
    element.addEventListener('keyup', keyUpListener);
    return () => {
        element.removeEventListener('keydown', keyDownListener);
        element.removeEventListener('keyup', keyUpListener);
    };
}

function isMatchModifier(e: KeyboardEvent, config: KeyConfig): boolean {
    return (e.metaKey === config.command) && (e.ctrlKey === config.control) && (e.altKey === config.alt) && (e.shiftKey === config.shift);
}

function isMatchCode(e: KeyboardEvent, config: KeyConfig): boolean {
    return normalizeCode(e.code) === config.code;
}

function normalizeCode(code: string): string {
    if (code.startsWith('Key') && code.length === 4) {
        return code[3];
    }
    if (code.startsWith('Digit')) {
        return code.substring(5);
    }
    if (code.startsWith('Numpad')) {
        return code.substring(6);
    }
    if (/^F\d+$/.test(code)) {
        return code;
    }

    const filter = ['Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Enter', 'Semicolon', 'Quote', 'Backquote', 'Backslash', 'Comma', 'Period', 'Slash', 'Space'];
    if (filter.includes(code)) {
        return code;
    }

    return '';
}
