/*
 *  Copyright 2023 qitoi
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


import { shareScreenshot } from '../../background/share-twitter';
import { MessageServerBuilder } from '../server';


export function SnsShareServer(server: MessageServerBuilder): void {
    server.handle('share-screenshot', async request => {
        await shareScreenshot(request.video, request.screenshots, request.hashtags);
    });
}
