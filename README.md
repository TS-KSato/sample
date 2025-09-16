# 未成年返金申請フォーム（GitHub Pages・最新版）

**目的**: `refund.example.com` で、1000サイト共通の返金申請窓口を**静的**（無料）運用。  
本版は次を満たします：

- **対象ドメイン** … 初期値: `https://ts-ksato.github.io/sample/`（URLを貼ってもホスト名抽出）
- **サービス名** … テキスト入力
- **キャリア** … `docomo / ahamo / au / povo / UQmobile / SoftBank / LINEMO`
- **対象の決済番号** … キャリアに応じてラベル自動切替  
  - `docomo / ahamo` → **決済番号**  
  - `au / povo / UQmobile` → **継続課金ID**  
  - `SoftBank / LINEMO` → **注文番号**

## 法的配慮（実装上の趣旨：法的助言ではありません）
- **個人情報保護法**: 収集目的・保管期間・第三者提供の可能性を明示。最小限のデータのみ収集。  
- **消費者契約法**: 入力項目を絞り、2分以内で完了する簡素UI。  
- **刑法246条（詐欺罪）**: 抑止文言を冒頭に赤字で明示。  
- **資金決済法**: キャリア/決済番号を必須化。

## デプロイ（GitHub Pages）
1. 初回コミット
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
