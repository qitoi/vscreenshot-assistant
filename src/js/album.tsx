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
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import { getLocalizedText } from './lib/localize';
import App from './album/App';
import { store } from './album/store';

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <Provider store={store}>
                <HelmetProvider>
                    <Helmet titleTemplate={`${getLocalizedText('extension_name')} - %s`}>
                        <title>{getLocalizedText('album')}</title>
                    </Helmet>
                    <App />
                </HelmetProvider>
            </Provider>
        </React.StrictMode>
    );
}
