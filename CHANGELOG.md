# Changelog

本文件记录项目的主要更新。

---

## [Unreleased]

### 2026-01-08

#### 新增功能

**Settings System - API Key 与模型管理**

- 新增 `/settings/keys` 页面 - 可视化管理 API 密钥
  - 支持查看、设置、删除 API Key
  - 支持一键验证 Key 有效性
  - 支持恢复默认配置

- 新增 `/settings/models` 页面 - 可视化管理模型配置
  - 支持查看所有模型配置
  - 支持新增、编辑、删除模型
  - 全字段可配置：provider、model_name、api_key_env、base_url、thinking_level、supports_cache、description
  - 支持恢复默认配置

**后端 API**

- `GET /api/settings/keys` - 获取 API Key 配置状态
- `PUT /api/settings/keys/{key_name}` - 设置 API Key
- `DELETE /api/settings/keys/{key_name}` - 删除 API Key
- `POST /api/settings/keys/reset` - 恢复默认配置
- `POST /api/settings/keys/validate` - 验证 Key 有效性
- `GET /api/settings/models` - 获取所有模型配置
- `GET /api/settings/models/{model_id}` - 获取单个模型
- `POST /api/settings/models/{model_id}` - 新增模型
- `PUT /api/settings/models/{model_id}` - 更新模型
- `DELETE /api/settings/models/{model_id}` - 删除模型
- `POST /api/settings/models/reset` - 恢复默认模型配置

**后端服务**

- `ApiKeyService` - API Key 管理服务（操作 `.env` 文件）
- `ModelConfigService` - 模型配置管理服务（操作 `models.yaml`）

---

**Cache UX 优化**

- 切换到 Google 模型时自动验证缓存有效性
- 非 Google 模型选中时显示缓存不可用警告
- 新增 `GET /api/cache/validate/{cache_name}` 端点
- `CacheManager` 新增 `validate_cache_by_name()` 方法

**模型路由策略优化**

- 修复非 Google 模型请求可能被路由到 Gemini 的问题
- `BaseService.process_aware_request` 现在会强制禁用非 Google 模型的缓存
- 确保用户选择的模型是唯一的路由权威

---

## [1.0.0] - 初始版本

- 6 阶段短剧创作流程
- Google Gemini + DeepSeek 多模型支持
- Context Caching 支持
- DTG 理论体系文档
