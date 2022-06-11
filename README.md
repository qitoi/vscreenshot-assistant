# VScreenshot Assistant

VScreenshot Assistant は YouTube 他いくつかの動画配信プラットフォームに対応した、動画のスクリーンショット撮影を支援するブラウザ拡張です。

## インストール

* [Chrome](https://chrome.google.com/webstore/detail/vscreenshot-assistant/hbhdiggpckgjgbclombabhdgnbpjgiln)
* [Firefox](https://addons.mozilla.org/ja/firefox/addon/vscreenshot-assistant/)
* [Edge](https://microsoftedge.microsoft.com/addons/detail/jgkckgfccojgadomgpkhmbnjgfakgpoc)

## ビルド方法

```shell
npm install
npm run build
```

## 使い方

### キャプチャ

対応プラットフォームの動画再生中にキーを押すことでスクリーンショットの撮影ができます。

| 機能 | デフォルトキー設定 | 説明 |
|---------|---------------------|-------------|
| スクリーンショット | Shift + S | キーを押下するとスクリーンショットを撮影します |
| 連続スクリーンショット | Shift + D | キーの押下中、連続してスクリーンショットを撮影します |
| アニメーションGIF撮影 | Shift + V | キーの押下中、連続してスクリーンショットを撮影し、アニメーションGIFを作成します |

### アルバム

VScreenshot Assistant のアイコンをクリック、あるいはアイコンのコンテキストメニューの 「アルバムを表示」をクリックすることで、アルバムウィンドウを開きます。  
アルバムウィンドウでは撮影したスクリーンショットの閲覧や管理ができます。

#### まとめて保存

選択した動画のスクリーンショットをZIPファイルにまとめて保存することができます。

#### Twitter投稿

アルバムウィンドウでスクリーンショットを選択し Tweet ボタンをクリックすると Twitter の投稿画面が開きます。  
このとき、自動的にタイトルやURLなどの動画情報が入力され、スクリーンショットが添付された状態になります。

この機能を使用する場合は twitter.com にログインしておく必要があります。

## 対応プラットフォーム

* Youtube
* Twitch
* ニコニコ動画
* SPWN
* Streaming+ (イープラス)
* ホロライブ公式ファンクラブ/ときのそらオフィシャルファンクラブ

## ライセンス

Apache License 2.0

```
Copyright 2021 qitoi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
