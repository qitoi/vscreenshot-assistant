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
import { Box, Button, Center, Progress, Text } from '@chakra-ui/react';

import * as prefs from '../../../libs/prefs';
import * as messages from '../../../messages/client';
import { LocalizedText } from '../../../components/LocalizedText';
import Dialog from '../../../components/Dialog';
import ControlGroup from '../../components/ControlGroup';
import LabeledControl from '../../components/LabeledControl';
import PreferenceBlock from './PreferenceBlock';

const ResetPreferences: React.FC = () => {
    const [isOpenResetPrefs, setIsOpenResetPrefs] = React.useState<boolean>(false);
    const handleOpenResetPrefs = React.useCallback(() => setIsOpenResetPrefs(true), []);
    const handleResetPrefsCancel = React.useCallback(() => setIsOpenResetPrefs(false), []);
    const handleResetPrefs = React.useCallback(async () => {
        await prefs.resetPreferences();
        setIsOpenResetPrefs(false);
    }, []);

    const [isOpenResetStorage, setIsOpenResetStorage] = React.useState<boolean>(false);
    const [isResettingStorage, setIsResettingStorage] = React.useState<boolean>(false);
    const handleOpenResetStorage = React.useCallback(() => setIsOpenResetStorage(true), []);
    const handleResetStorageCancel = React.useCallback(() => setIsOpenResetStorage(false), []);
    const handleResetStorage = React.useCallback(async () => {
        setIsResettingStorage(true);

        await messages.sendMessage('reset-storage', {});

        setIsOpenResetStorage(false);
        setIsResettingStorage(false);
    }, []);

    return (
        <>
            <PreferenceBlock messageId="prefs_reset">
                <ControlGroup>
                    <LabeledControl messageId="prefs_reset_preferences">
                        <Button _focus={{ boxShadow: 'none' }} onClick={handleOpenResetPrefs}>
                            <LocalizedText messageId="prefs_reset_preferences_button" />
                        </Button>
                    </LabeledControl>
                </ControlGroup>
                <ControlGroup>
                    <LabeledControl messageId="prefs_reset_storage">
                        <Button _focus={{ boxShadow: 'none' }} onClick={handleOpenResetStorage}>
                            <LocalizedText messageId="prefs_reset_storage_button" />
                        </Button>
                    </LabeledControl>
                </ControlGroup>
            </PreferenceBlock>

            <Dialog isOpen={isOpenResetPrefs}
                    okLabel={<LocalizedText messageId="prefs_reset_preferences_dialog_exec" />}
                    cancelLabel={<LocalizedText messageId="prefs_reset_preferences_dialog_cancel" />}
                    isButtonDisabled={isResettingStorage}
                    onOK={handleResetPrefs}
                    onCancel={handleResetPrefsCancel}>
                <Box>
                    <Center><Text py="1em"><LocalizedText messageId="prefs_reset_preferences_dialog_label" /></Text></Center>
                </Box>
            </Dialog>

            <Dialog isOpen={isOpenResetStorage}
                    okLabel={<LocalizedText messageId="prefs_reset_storage_dialog_exec" />}
                    cancelLabel={<LocalizedText messageId="prefs_reset_storage_dialog_cancel" />}
                    isButtonDisabled={isResettingStorage}
                    onOK={handleResetStorage}
                    onCancel={handleResetStorageCancel}>
                {!isResettingStorage
                    ? (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="prefs_reset_storage_dialog_confirm_label" /></Text></Center>
                        </Box>
                    ) : (
                        <Box>
                            <Center><Text py="1em"><LocalizedText messageId="prefs_reset_storage_dialog_label" /></Text></Center>
                            <Progress isIndeterminate />
                        </Box>
                    )
                }
            </Dialog>
        </>
    );
};

export default ResetPreferences;
