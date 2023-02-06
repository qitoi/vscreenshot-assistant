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

import * as prefs from './libs/prefs';
import * as action from './background/action';
import * as popup from './background/popup-window';
import { PopupWindow } from './background/popup-window';
import { MessageServer, PortServer } from './messages/server';
import { AnimeCaptureServer, CaptureServer } from './messages/capture/server';
import { KeepAliveServer } from './messages/keep-alive/server';
import { AlbumServer } from './messages/album/server';
import { SnsShareServer } from './messages/sns-share/server';


// アルバムウィンドウの作成
const albumWindow = PopupWindow.create('album', 'album.html', true);

// ポップアップウィンドウのイベント監視
popup.watch();

// アクションアイコンの設定
action.setup(albumWindow);

// 設定の変更監視
prefs.watch();


// メッセージサーバの設定
new MessageServer()
    .bind(CaptureServer)
    .bind(AlbumServer)
    .bind(SnsShareServer)
    .listen();

new PortServer()
    .bind(AnimeCaptureServer)
    .bind(KeepAliveServer)
    .listen();
