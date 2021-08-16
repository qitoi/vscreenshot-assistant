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
import { Button, ButtonGroup, VStack } from '@chakra-ui/react';

import * as prefs from '../../../lib/prefs';
import { LocalizedText } from '../../../lib/components/LocalizedText';
import { FormProvider, useForm } from 'react-hook-form';
import ScreenshotPreferences from './ScreenshotPreferences';
import ThumbnailPreferences from './ThumbnailPreferences';
import TweetPreferences from './TweetPreferences';
import GeneralPreferences from './GeneralPreferences';
import AnimationPreferences from './AnimationPreferences';


const PreferenceForm: React.FC = () => {
    const methods = useForm<prefs.Preferences>({
        defaultValues: prefs.DefaultPreferences,
    });
    const { handleSubmit, formState: { isSubmitting, isDirty }, reset } = methods;
    const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

    React.useEffect(() => {
        const onChanged = prefs.watch();

        // 初期値取得
        prefs.loadPreferences().then(p => {
            reset(p);
            setIsLoaded(true);
        });

        // 設定の変更監視
        const callback = (p: prefs.Preferences) => {
            reset(p);
        };
        onChanged.addListener(callback);
        return () => onChanged.removeListener(callback);
    }, [reset]);

    const onSubmit = async (values: prefs.Preferences) => {
        await prefs.savePreferences(values);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <VStack w="60em" marginX="auto">
                    <GeneralPreferences />
                    <ScreenshotPreferences />
                    <ThumbnailPreferences />
                    <TweetPreferences />
                    <AnimationPreferences />
                    <ButtonGroup>
                        <Button colorScheme="blue" isLoading={isSubmitting} isDisabled={!isDirty} type="submit">
                            <LocalizedText messageId="prefs_save" />
                        </Button>
                    </ButtonGroup>
                </VStack>
            </form>
        </FormProvider>
    );
};

export default PreferenceForm;
