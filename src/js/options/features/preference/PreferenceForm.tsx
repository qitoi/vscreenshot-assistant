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
import { chakra, Button, VStack, Spacer, HStack, Box } from '@chakra-ui/react';

import * as prefs from '../../../libs/prefs';
import { LocalizedText } from '../../../components/LocalizedText';
import { FormProvider, useForm } from 'react-hook-form';
import ScreenshotPreferences from './ScreenshotPreferences';
import AlbumPreferences from './AlbumPreferences';
import TweetPreferences from './TweetPreferences';
import GeneralPreferences from './GeneralPreferences';
import AnimationPreferences from './AnimationPreferences';
import ResetPreferences from './ResetPreferences';


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
            <chakra.form onSubmit={handleSubmit(onSubmit)}>
                <Box w="100%" minH="calc(100vh - 8em)" py="4em">
                    <VStack maxW="50em" mx="auto" spacing="4em">
                        <GeneralPreferences />
                        <ScreenshotPreferences />
                        <AnimationPreferences />
                        <AlbumPreferences />
                        <TweetPreferences />
                        <ResetPreferences />
                    </VStack>
                </Box>
                <Box w="100%" h="8em" position="sticky" bottom={0} bgColor="white" borderTopColor="gray.500" borderTopWidth="1px">
                    <HStack w="60em" h="100%" px="2em" mx="auto">
                        <Spacer />
                        <Button colorScheme="blue" isLoading={isSubmitting} isDisabled={!isDirty} type="submit">
                            <LocalizedText messageId="prefs_save" />
                        </Button>
                    </HStack>
                </Box>
            </chakra.form>
        </FormProvider>
    );
};

export default PreferenceForm;
