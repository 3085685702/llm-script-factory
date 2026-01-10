# Codebase Review & Issues

## 1. Input Validation & Robustness

### 1.1 JSON Schema Validation
- **Location**: `backend/utils/file_manager.py`
- **Issue**: The `_validate_schema_logic` method provides basic validation for `array` and `object` types and `required` fields. However, it lacks validation for primitive types (string, number, boolean). If a schema expects a string but receives an integer, the current validation might pass.
- **Recommendation**: Enhance `_validate_schema_logic` to check `type` for primitives (e.g., `if schema.get("type") == "string" and not isinstance(data, str): ...`).

### 1.2 Parsing Logic
- **Location**: `backend/services/stage2_structure.py`
- **Issue**: In `generate_batch`, episode range parsing uses `episodes_str.replace(" ", "").split("-")`. This assumes a strict "X-Y" format. AI might output "X to Y", "X~Y", or "Episode X".
- **Recommendation**: Use a more robust regex for parsing episode ranges.

- **Location**: `backend/services/stage6_doctor.py`
- **Issue**: `parse_text_to_script` uses regex `re.match(r'^[早晚日月夜午]/.+', s_line)` to detect time headers. This is specific to Chinese script formats and might be too rigid if the AI varies its output format slightly.
- **Recommendation**: Soften the regex or provide fallback parsing logic.

## 2. LLM Integration

### 2.1 DeepSeek / OpenAI Compatible Models
- **Location**: `backend/utils/llm_manager.py`
- **Observation**: Structured output (`response_format={"type": "json_schema"}`) is explicitly disabled for the `openai` provider (commented out: `response_schema=None # response_schema # DeepSeek 不支持 response_format，暂时禁用`).
- **Impact**: DeepSeek models rely on prompt engineering for JSON structure. If the model fails to follow the JSON structure instruction, the `json.loads` in `LLMManager` will fail.
- **Recommendation**: Ensure prompts for DeepSeek are very explicit about JSON formatting. Consider adding a "repair" mechanism if JSON parsing fails.

### 2.2 Schema Support Consistency
- **Location**: `backend/utils/llm_gateway.py`
- **Issue**: `call_openai` implements `json_schema` support, but it's currently unused by `LLMManager`.
- **Recommendation**: If future OpenAI-compatible models support `json_schema`, this can be enabled via configuration.

## 3. File System & Concurrency

### 3.1 Race Conditions
- **Location**: General file operations in `backend/services/`.
- **Issue**: The application uses JSON files for persistence (`story_bible.json`, `detailed_outlines.json`, etc.). There is no file locking mechanism. If multiple concurrent requests (e.g., from multiple users or parallel batch generation) attempt to write to the same file, data corruption or lost updates could occur.
- **Recommendation**: Implement a file locking mechanism (e.g., using `filelock` library) in `FileManager.save_json`.

### 3.2 Path Handling
- **Location**: `backend/services/stage1_idea.py` and others.
- **Issue**: `_get_story_bible_path` raises `ValueError` if the project directory doesn't exist. This is generally handled, but ensuring the directory structure (subfolders like `1_ideas`) exists before file operations is crucial. `save_json` handles creation, but explicit checks during initialization could be safer.

## 4. Error Handling

### 4.1 Generic Error Responses
- **Location**: `backend/api/routers/`
- **Issue**: Most endpoints catch `Exception` and raise `HTTPException(status_code=500, detail=str(e))`. This exposes internal error details to the client and doesn't distinguish between client errors (e.g., invalid input) and server errors.
- **Recommendation**: Catch specific exceptions (e.g., `ValueError`, `FileNotFoundError`) and return appropriate 4xx status codes. Use 500 only for unexpected errors and log the stack trace.

## 5. Configuration

### 5.1 Environment Variables
- **Location**: `backend/utils/llm_gateway.py`
- **Issue**: The `_retry_wrapper` catches `OSError` which is very broad. It might mask underlying issues that shouldn't be retried.
- **Recommendation**: Refine the exception types caught in the retry loop.

## 6. Logic Specifics

### 6.1 Stage 1 Detailed Cards
- **Location**: `backend/services/stage1_idea.py`
- **Issue**: `generate_detailed_cards` validates `detailed_cards` against a schema. If the LLM returns a list instead of `{"detailed_cards": [...]}`, the service attempts to handle it, but the schema validation `validate_json({"detailed_cards": new_cards}, ...)` assumes the transformation was correct.
- **Recommendation**: Ensure the LLM response is rigorously normalized before schema validation.

### 6.2 Stage 4 & 5 Registry
- **Location**: `backend/services/stage4_writer.py`
- **Issue**: The character registry is updated based on `new_appearances` from the LLM response. If the LLM hallucinates names or formats, the registry might get polluted.
- **Recommendation**: Validate character names against the `story_bible` (if possible) or sanitize inputs before adding to registry.
