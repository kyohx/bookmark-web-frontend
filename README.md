# bookmark-web-frontend

[![CI](https://github.com/kyohx/bookmark-web-frontend/workflows/CI/badge.svg)](https://github.com/kyohx/bookmark-web-frontend/actions)

## 概要

ブックマークを管理するためのWebフロントエンドアプリケーション

バックエンドWebAPI([bookmark-sample](https://github.com/kyohx/bookmark-sample))が動作していること

## スクリーンショット

<img width="1238" height="1194" alt="Image" src="https://github.com/user-attachments/assets/98f9755a-f268-4af5-84c7-f7f78f68ad3b" />

## 技術スタック

- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Variables)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright

## ディレクトリ構造

- `docs/` - ドキュメント
- `src/` - ソースコード
  - `api/` - APIクライアント
  - `components/` - 再利用可能なコンポーネント
  - `pages/` - ページコンポーネント
  - `styles/` - グローバルスタイル・変数
  - `App.tsx` - ルーティング設定
  - `main.tsx` - エントリーポイント
- `tests/` - テストファイル
- `public/` - 静的ファイル

## セットアップ

### 前提条件

- Node.js (推奨バージョン: 18以上)
- npm

### インストール


#### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

Docker Compose でフロントエンドと API 一式を起動する場合:

```bash
docker compose -f compose.e2e.yaml up --build frontend
```

この構成では以下が起動します。

- フロントエンド: `http://localhost:5173`
- API: `http://localhost:8000`

### ビルド

プロダクション用にビルドする場合:

```bash
npm run build
```

ビルドされたファイルは`dist/`ディレクトリに出力される。

### プレビュー

ビルドしたアプリケーションをローカルでプレビューする場合:

```bash
npm run preview
```

## テスト

### テストの実行

```bash
npm test
```

### E2Eテストの実行

フロントエンド・API・DB・Redis・Playwright をまとめて Docker Compose で起動して実行します。

前提として sibling ディレクトリに API リポジトリ `../bookmark-sample` が存在する必要があります。

```bash
npm run test:e2e:docker
```

テスト実行後に停止済みコンテナとボリュームも含めて片付ける場合:

```bash
docker compose -f compose.e2e.yaml down -v
```

### Lint

コードの静的解析:

```bash
npm run lint
```

### 環境変数の設定

本番環境などローカル環境とは異なるバックエンドAPIのURLに接続する場合、環境変数の設定が必要となる。

詳細は [環境変数の設定](./docs/environment-variables.md) を参照

## 使い方

### ログイン

1. ログイン画面(`/login`)でユーザー名とパスワードを入力
2. ログイン成功後、自動的にダッシュボードへリダイレクトされる

### ブックマーク管理

- **追加**: 「Add Bookmark」ボタンをクリックして、URL、メモ、タグを入力
- **編集**: 各ブックマークカードの編集(鉛筆アイコン)ボタンをクリック
- **削除**: 各ブックマークカードの削除(ゴミ箱アイコン)ボタンをクリック
- **フィルタリング**: タグフィルタフィールドでインクリメンタル検索が可能
- **権限レベル**: 読み取り専用ユーザーの場合、追加/編集/削除のボタンは表示されない

## 詳細仕様

[spec.md](./docs/spec.md)を参照
