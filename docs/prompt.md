由分組其中一位同學繳交即可

繳交項目 : 專案 GitHub 連結、Demo 影片 (可為 YouTube 連結、雲端影片檔案...)



評分依據 : 5個後端安全設計、3個前端安全設計、說明2個其他還可優化的設計或規劃(不限)

專案程式碼是評分重點之一，實作建議如下 : 
- 有良好架構(模組化、分層設計、清晰的檔案與資料夾結構)
- 可讀可維護(一致的命名規範與程式風格、適度拆分函式，避免過長或過度複雜的程式)
- 程式安全(避免硬編碼敏感資訊如 API key、密碼)
- 專案管理(如分支管理、清楚的 commit message)



專案中應包含 :

- 專案概述(專案功能、架構、部屬方式、運行流程)

- 專案完整原始碼

- 安全設計說明

- 專案測試的運行環境

- 資料庫建置方式與資料表設計 (可遮蔽敏感內容)



*如前後端都有實作相同的安全設計 (如防止SQLi的字串清洗，需在影片個別測試前後端)



加分項目 : 

- 集成 CI/CD 做靜態或動態原始碼分析

- 於專案影片中示範對於不同用戶身分之不同資源存取權限與控制

- 集成 Dockerfile 或 docker-compose 實現快速部屬

- 多因認證 或 OTP一次密碼 等



CI/CD 原碼分析可參考 
- https://janelifelog.medium.com/github-actions-scan-code-41c82ec82140

- https://blog.devops.dev/step-by-step-guide-to-creating-a-ci-cd-pipeline-on-github-705828467278

- https://notes.kodekloud.com/docs/GitHub-Actions-Certification/Security-Guide/Use-CodeQL-as-a-step-in-a-workflow
且須能檢視分析結果