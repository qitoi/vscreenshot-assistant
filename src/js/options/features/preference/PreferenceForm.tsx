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
import { Button, ButtonGroup, useBoolean, VStack, } from '@chakra-ui/react';

import { DefaultPreferences, loadPreferences, Preferences, PREFERENCES_KEY, savePreferences } from '../../../lib/background/preferences';
import { FormProvider, useForm } from 'react-hook-form';
import { ScreenshotPreferences } from './ScreenshotPreferences';
import { ThumbnailPreferences } from './ThumbnailPreferences';
import { TweetPreferences } from './TweetPreferences';


export function PreferenceForm() {
    const methods = useForm<Preferences>({
        defaultValues: DefaultPreferences,
    });
    const { handleSubmit, formState: { isSubmitting, isDirty }, reset } = methods;
    const [isLoaded, setIsLoaded] = useBoolean(false);

    React.useEffect(() => {
        loadPreferences().then(prefs => {
            reset(prefs);
            setIsLoaded.on();
        });
    }, []);

    React.useEffect(() => {
        const callback = (changes: { [key: string]: chrome.storage.StorageChange }, area: chrome.storage.AreaName) => {
            if (area !== 'local') {
                return;
            }
            for (const [key, change] of Object.entries(changes)) {
                if (key === PREFERENCES_KEY) {
                    if ('newValue' in change) {
                        reset(change.newValue);
                    }
                }
            }
        };
        chrome.storage.onChanged.addListener(callback);
        return () => chrome.storage.onChanged.removeListener(callback);
    }, []);

    const onSubmit = async (values: Preferences) => {
        await savePreferences(values);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <VStack w="50em" marginX="auto">
                    <ScreenshotPreferences />
                    <ThumbnailPreferences />
                    <TweetPreferences />
                    <ButtonGroup>
                        <Button colorScheme="blue" isLoading={isSubmitting} isDisabled={!isDirty} type="submit">Save</Button>
                    </ButtonGroup>
                </VStack>
            </form>
        </FormProvider>
    );
}
