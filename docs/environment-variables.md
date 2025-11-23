# 環境変数の設定

## 概要

このプロジェクトでは、環境変数を使用してバックエンドAPIのURLを動的に切り替えることができます。これにより、開発環境、ステージング環境、本番環境など、異なる環境で異なるAPIエンドポイントを使用できます。

## 環境変数一覧

### `VITE_BACKEND_API_URL`

バックエンドAPIのベースURLを指定します。

- **型**: 文字列（URL）
- **デフォルト値**: 空文字列（Viteプロキシを使用）
- **例**: `http://localhost:8000`, `https://api.example.com`

## 設定方法

### 1. `.env.local`ファイルの作成

プロジェクトルートで`.env.example`をコピーして`.env.local`を作成します:

```bash
cp .env.example .env.local
```

### 2. 環境変数の設定

`.env.local`ファイルを開き、使用する環境に合わせてコメントを外して編集します:

```bash
# 開発環境（ローカルバックエンド）
VITE_BACKEND_API_URL=http://localhost:8000

# ステージング環境
# VITE_BACKEND_API_URL=https://api-staging.example.com

# 本番環境
# VITE_BACKEND_API_URL=https://api.example.com
```

### 3. 開発サーバーの再起動

環境変数を変更した場合は、開発サーバーを再起動する必要があります:

```bash
# 開発サーバーを停止（Ctrl+C）してから再度起動
npm run dev
```

## 環境別の設定例

### 開発環境（Viteプロキシ使用）

環境変数を設定しない、または空にすると、`vite.config.ts`で設定されたプロキシが自動的に使用されます。これがデフォルトの動作です。

```bash
# .env.localファイルを作成しない、または以下のように設定
VITE_BACKEND_API_URL=
```

プロキシ設定により、`http://localhost:5173/bookmarks`へのリクエストは自動的に`http://localhost:8000/bookmarks`に転送されます。

### 開発環境（プロキシを使用しない）

ローカルのバックエンドに直接接続する場合:

```bash
VITE_BACKEND_API_URL=http://localhost:8000
```

### ステージング環境

```bash
VITE_BACKEND_API_URL=https://api-staging.example.com
```

### 本番環境

```bash
VITE_BACKEND_API_URL=https://api.example.com
```

## ビルド時の注意事項

### プロダクションビルド

本番環境用にビルドする場合は、適切な環境変数を設定してからビルドを実行します:

```bash
# .env.localに本番URLを設定
echo "VITE_BACKEND_API_URL=https://api.example.com" > .env.local

# ビルド実行
npm run build
```

### 環境別のビルド

異なる環境向けに複数のビルドを作成する場合は、環境変数ファイルを分けて管理することをお勧めします:

```bash
# ステージング用
cp .env.example .env.staging
# .env.stagingを編集してステージングURLを設定

# 本番用
cp .env.example .env.production
# .env.productionを編集して本番URLを設定
```

ビルド時に使用する環境変数ファイルを指定:

```bash
# ステージング用ビルド
cp .env.staging .env.local
npm run build

# 本番用ビルド
cp .env.production .env.local
npm run build
```

## トラブルシューティング

### 環境変数が反映されない

**原因**: 環境変数の変更後、開発サーバーを再起動していない。

**解決方法**: 開発サーバーを停止（Ctrl+C）して再度起動してください。

### APIリクエストが404エラーになる

**原因**: `VITE_BACKEND_API_URL`が正しく設定されていない、またはバックエンドサーバーが起動していない。

**解決方法**:
1. `.env.local`ファイルの`VITE_BACKEND_API_URL`を確認
2. バックエンドサーバーが起動していることを確認
3. URLの末尾に`/`が含まれていないことを確認（例: `http://localhost:8000` ✓、`http://localhost:8000/` ✗）

### CORSエラーが発生する

**原因**: バックエンドAPIがフロントエンドのオリジンを許可していない。

**解決方法**:
- 開発環境ではViteプロキシを使用（`VITE_BACKEND_API_URL`を未設定）
- 本番環境ではバックエンド側でCORSを適切に設定

## セキュリティに関する注意

### `.env.local`ファイルの管理

- `.env.local`ファイルはGitにコミットしないでください（`.gitignore`に含まれています）
- 機密情報は`.env.local`に記載せず、安全な方法で管理してください
- `.env.example`は機密情報を含まないサンプルとして管理します

### `VITE_`プレフィックスの重要性

Viteの環境変数は`VITE_`プレフィックスが必要です。これはViteのセキュリティ機能であり、クライアント側のコードに公開されても安全な変数のみをバンドルに含めるためです。

## 参考資料

- [Vite環境変数と開発モード](https://ja.vitejs.dev/guide/env-and-mode.html)
- [プロジェクトREADME](../README.md)
