# 代码库审查与问题 (Codebase Review & Issues)

## 1. 输入验证与健壮性 (Input Validation & Robustness)

### 1.1 JSON Schema 验证
- **位置**: `backend/utils/file_manager.py`
- **问题**: `_validate_schema_logic` 方法仅对 `array` 和 `object` 类型以及 `required` 字段进行了基本验证。它缺乏对原始类型（字符串、数字、布尔值）的验证。如果 Schema 期望一个字符串但接收到一个整数，当前的验证可能会通过。
- **建议**: 增强 `_validate_schema_logic` 以检查原始类型的 `type`（例如：`if schema.get("type") == "string" and not isinstance(data, str): ...`）。

### 1.2 解析逻辑
- **位置**: `backend/services/stage2_structure.py`
- **问题**: 在 `generate_batch` 中，集数范围的解析使用了 `episodes_str.replace(" ", "").split("-")`。这假设了严格的 "X-Y" 格式。AI 可能会输出 "X to Y"、"X~Y" 或 "Episode X"。
- **建议**: 使用更健壮的正则表达式来解析集数范围。

- **位置**: `backend/services/stage6_doctor.py`
- **问题**: `parse_text_to_script` 使用正则表达式 `re.match(r'^[早晚日月夜午]/.+', s_line)` 来检测时间头。这是针对中文剧本格式的特定写法，如果 AI 的输出格式稍有变化，解析可能会失败。
- **建议**: 放宽正则表达式的匹配条件或提供回退解析逻辑。

## 2. LLM 集成 (LLM Integration)

### 2.1 DeepSeek / OpenAI 兼容模型
- **位置**: `backend/utils/llm_manager.py`
- **观察**: 对于 `openai` 提供商（包括 DeepSeek），结构化输出（`response_format={"type": "json_schema"}`）被显式禁用（代码注释：`response_schema=None # response_schema # DeepSeek 不支持 response_format，暂时禁用`）。
- **影响**: DeepSeek 模型依赖提示词工程来生成 JSON 结构。如果模型未能遵循 JSON 结构指令，`LLMManager` 中的 `json.loads`将会失败。
- **建议**: 确保针对 DeepSeek 的提示词非常明确地要求 JSON 格式。考虑增加一个“修复”机制，如果 JSON 解析失败则尝试修复。

### 2.2 Schema 支持的一致性
- **位置**: `backend/utils/llm_gateway.py`
- **问题**: `call_openai` 实现了 `json_schema` 支持，但目前 `LLMManager` 未使用该功能。
- **建议**: 如果未来的 OpenAI 兼容模型支持 `json_schema`，可以通过配置启用此功能。

## 3. 文件系统与并发 (File System & Concurrency)

### 3.1 竞态条件
- **位置**: `backend/services/` 中的通用文件操作。
- **问题**: 应用程序使用 JSON 文件进行持久化（`story_bible.json`、`detailed_outlines.json` 等）。没有文件锁定机制。如果多个并发请求（例如来自多个用户或并行批量生成）尝试写入同一个文件，可能会导致数据损坏或更新丢失。
- **建议**: 在 `FileManager.save_json` 中实现文件锁定机制（例如使用 `filelock` 库）。

### 3.2 路径处理
- **位置**: `backend/services/stage1_idea.py` 等。
- **问题**: 如果项目目录不存在，`_get_story_bible_path` 会引发 `ValueError`。虽然这通常会被处理，但在进行文件操作之前确保目录结构（如 `1_ideas` 子文件夹）存在是至关重要的。`save_json` 会处理创建，但在初始化期间进行显式检查可能更安全。

## 4. 错误处理 (Error Handling)

### 4.1 通用错误响应
- **位置**: `backend/api/routers/`
- **问题**: 大多数端点捕获 `Exception` 并引发 `HTTPException(status_code=500, detail=str(e))`。这会将内部错误详细信息暴露给客户端，并且无法区分客户端错误（例如无效输入）和服务器错误。
- **建议**: 捕获特定异常（例如 `ValueError`、`FileNotFoundError`）并返回适当的 4xx 状态代码。仅将 500 用于意外错误，并记录堆栈跟踪。

## 5. 配置 (Configuration)

### 5.1 环境变量
- **位置**: `backend/utils/llm_gateway.py`
- **问题**: `_retry_wrapper` 捕获了 `OSError`，这个范围非常广。它可能会掩盖不应重试的底层问题。
- **建议**: 细化重试循环中捕获的异常类型。

## 6. 逻辑细节 (Logic Specifics)

### 6.1 Stage 1 详细卡片 (Detailed Cards)
- **位置**: `backend/services/stage1_idea.py`
- **问题**: `generate_detailed_cards` 针对 schema 验证 `detailed_cards`。如果 LLM 返回一个列表而不是 `{"detailed_cards": [...]}`, 服务会尝试处理它，但在这种转换假设正确的情况下进行 schema 验证 `validate_json({"detailed_cards": new_cards}, ...)`。
- **建议**: 在进行 schema 验证之前，确保 LLM 响应经过严格的标准化处理。

### 6.2 Stage 4 & 5 角色注册表 (Registry)
- **位置**: `backend/services/stage4_writer.py`
- **问题**: 角色注册表是根据 LLM 响应中的 `new_appearances` 更新的。如果 LLM 幻视了名字或格式，注册表可能会被污染。
- **建议**: 根据 `story_bible` 验证角色名称（如果可能），或在添加到注册表之前清理输入。
