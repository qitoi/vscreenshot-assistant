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

import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    HStack,
} from '@chakra-ui/react';
import * as React from 'react';

type DeleteDialogProps = React.PropsWithChildren<{
    isOpen: boolean,
    title?: string,
    okLabel?: string,
    cancelLabel?: string,
    isButtonDisabled?: boolean,
    onOK?: () => void,
    onCancel?: () => void,
}>;

const Dialog = React.memo(({ isOpen, title, okLabel, cancelLabel, isButtonDisabled, onOK, onCancel, children }: DeleteDialogProps) => {
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    return (
        <AlertDialog
            isOpen={isOpen}
            isCentered
            leastDestructiveRef={cancelRef}
            closeOnOverlayClick={false}
            closeOnEsc={isButtonDisabled !== true}
            onClose={onCancel}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {title}
                    </AlertDialogHeader>
                    <AlertDialogBody fontSize="md">
                        {children}
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <HStack>
                            {okLabel && <Button colorScheme="red" disabled={isButtonDisabled} onClick={onOK}>
                                {okLabel}
                            </Button>}
                            {cancelLabel && <Button ref={cancelRef} disabled={isButtonDisabled} onClick={onCancel}>
                                {cancelLabel}
                            </Button>}
                        </HStack>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
});

export default Dialog;
