# 画面遷移図

このドキュメントは、bookmark-web-frontendアプリケーションの画面遷移を示すMermaid図です。

## 1. メイン画面遷移

```mermaid
flowchart TD
    Start([アプリ起動]) --> Login["ログイン画面<br/>(URL: /login)"]
    Login --> LoginSuccess{"ログイン"}
    LoginSuccess -->|成功| Dashboard["ダッシュボード<br/>(URL: /, PrivateRoute)"]
    LoginSuccess -->|失敗| Login
    Dashboard -->|ログアウト| Login
    Dashboard -->|タグフィルタ| Dashboard
    Dashboard -->|ページング| Dashboard
    
    classDef screenStyle fill:#6366f1,stroke:#4f46e5,stroke-width:3px,color:#fff
    class Login,Dashboard screenStyle
```



---

## 2. ブックマーク追加フロー

```mermaid
flowchart TD
    Dashboard1["ダッシュボード"] -->|"Add Bookmarkボタン<br/>クリック<br/>(編集権限があること)"| AddModal["ブックマーク追加モーダル"]
    AddModal -->|"Saveボタン<br/>クリック"| AddConfirm["追加確認モーダル"]
    AddModal -->|"Cancelボタン、<br/>✕ボタン、または<br/>背景クリック"| Dashboard2["ダッシュボード"]
    AddConfirm -->|"Addボタン<br/>クリック"| Dashboard2
    AddConfirm -->|"Cancelボタン、<br/>✕ボタン、または<br/>背景クリック"| Dashboard2
    
    classDef screenStyle fill:#6366f1,stroke:#4f46e5,stroke-width:3px,color:#fff
    classDef modalStyle fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#fff
    classDef confirmStyle fill:#059669,stroke:#047857,stroke-width:2px,color:#fff
    
    class Dashboard1,Dashboard2 screenStyle
    class AddModal modalStyle
    class AddConfirm confirmStyle
```

---

## 3. ブックマーク編集フロー

```mermaid
flowchart TD
    Dashboard1["ダッシュボード"] -->|"ブックマークカードの<br/>Editボタンクリック<br/>(編集権限があること)"| EditModal["ブックマーク編集モーダル"]
    EditModal -->|"Saveボタン<br/>クリック"| EditConfirm["編集確認モーダル"]
    EditModal -->|"Cancelボタン、<br/>✕ボタン、または<br/>背景クリック"| Dashboard2["ダッシュボード"]
    EditConfirm -->|"Save Changesボタン<br/>クリック"| Dashboard2
    EditConfirm -->|"Cancelボタン、<br/>✕ボタン、または<br/>背景クリック"| Dashboard2
    
    classDef screenStyle fill:#6366f1,stroke:#4f46e5,stroke-width:3px,color:#fff
    classDef modalStyle fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#fff
    classDef confirmStyle fill:#059669,stroke:#047857,stroke-width:2px,color:#fff
    
    class Dashboard1,Dashboard2 screenStyle
    class EditModal modalStyle
    class EditConfirm confirmStyle
```

---

## 4. ブックマーク削除フロー

```mermaid
flowchart TD
    Dashboard1["ダッシュボード"] -->|"ブックマークカードの<br/>Deleteボタンクリック<br/>(編集権限があること)"| DeleteConfirm["削除確認モーダル"]
    DeleteConfirm -->|"Deleteボタン<br/>クリック"| Dashboard2["ダッシュボード"]
    DeleteConfirm -->|"Cancelボタン、<br/>✕ボタン、または<br/>背景クリック"| Dashboard2
    
    classDef screenStyle fill:#6366f1,stroke:#4f46e5,stroke-width:3px,color:#fff
    classDef confirmStyle fill:#dc2626,stroke:#991b1b,stroke-width:3px,color:#fff
    
    class Dashboard1,Dashboard2 screenStyle
    class DeleteConfirm confirmStyle
```

---

## 凡例

| 色 | 用途 |
|---|---|
| 🟦 **青色** | メイン画面 (ログイン画面、ダッシュボード) |
| 🟪 **紫色** | 入力モーダル (ブックマーク追加・編集) |
| 🟢 **緑色** | 確認モーダル (追加・編集の確認) |
| 🟥 **赤色** | 削除確認モーダル |


