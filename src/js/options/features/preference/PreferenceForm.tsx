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

import * as prefs from '../../../lib/background/prefs';
import { FormProvider, useForm } from 'react-hook-form';
import { ScreenshotPreferences } from './ScreenshotPreferences';
import { ThumbnailPreferences } from './ThumbnailPreferences';
import { TweetPreferences } from './TweetPreferences';


export function PreferenceForm() {
    const methods = useForm<prefs.Preferences>({
        defaultValues: prefs.DefaultPreferences,
    });
    const { handleSubmit, formState: { isSubmitting, isDirty }, reset } = methods;
    const [isLoaded, setIsLoaded] = useBoolean(false);

    React.useEffect(() => {
        const onChanged = prefs.watch();

        // 初期値取得
        prefs.loadPreferences().then(p => {
            reset(p);
            setIsLoaded.on();
        });

        // 設定の変更監視
        const callback = (p: prefs.Preferences) => {
            reset(p);
        };
        onChanged.addEventListener(callback);
        return () => onChanged.removeEventListener(callback);
    }, []);

    const onSubmit = async (values: prefs.Preferences) => {
        await prefs.savePreferences(values);
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
