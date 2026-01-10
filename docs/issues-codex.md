# 代码审阅：潜在问题清单

以下内容基于项目“本地优先的 AI 短剧全流程工作站”的定位进行静态审阅，记录可能导致启动失败、配置读取异常或项目数据落盘错位的风险点，便于后续排查与修复。

## 1. 直接运行 `backend/main.py` 时缺少 `uvicorn` 导入
- **位置**：`backend/main.py` 的 `if __name__ == "__main__":` 分支
- **现象**：以 `python backend/main.py` 作为入口时，`uvicorn` 未导入会触发 `NameError`。
- **影响**：开发者采用 Python 直接运行方式启动后端时失败（虽然 README 推荐脚本启动，但该入口仍常见）。
- **建议**：在文件顶部显式 `import uvicorn`，或移除 `__main__` 分支并统一使用 `uvicorn` CLI 启动。

## 2. `models.yaml` 读取依赖当前工作目录，导致模型配置空读
- **位置**：`backend/utils/llm_manager.py::_load_config` 使用 `open("config/models.yaml")`
- **现象**：当后端并非在 `backend/` 目录作为 CWD 启动（例如从仓库根运行 `uvicorn backend.main:app`）时，配置文件会读取失败并返回空字典。
- **影响**：模型配置为空，API Key 管理与模型选择失效，前端可能提示“未检测到模型配置”。
- **建议**：改为基于文件路径的绝对路径（如 `Path(__file__).parent.parent / "config" / "models.yaml"`），与 `ModelConfigService` 的路径策略保持一致。

## 3. Import 服务写入路径与项目路径规范不一致
- **位置**：`backend/services/import_service.py::_save_story_bible`、`_load_stage4_scripts`
- **现象**：使用相对路径 `projects/{project_name}/...`，而其他服务统一通过 `ProjectService` 写入 `backend/projects`。
- **影响**：当后端以仓库根目录启动时，导入数据会写入错误目录（仓库根下的 `projects/`），造成数据“丢失”或前端无法读取。
- **建议**：复用 `ProjectService` 的 `root_dir`，或统一使用 `os.path.join(self.projects.root_dir, project_name, ...)` 来确保路径一致性。

