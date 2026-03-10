"""
Model Configuration Service
管理 models.yaml 文件中的模型配置
全字段 CRUD 操作
"""
import yaml
from pathlib import Path
from typing import Optional


class ModelConfigService:
    """模型配置管理服务，操作 models.yaml 文件"""
    
    CONFIG_PATH = Path(__file__).parent.parent / "config" / "models.yaml"
    CONFIG_BACKUP_PATH = Path(__file__).parent.parent / "config" / "models.yaml.bak"
    
    # 默认模型配置模板
    DEFAULT_MODELS = {
        "gemini-3-pro-high": {
            "provider": "google",
            "model_name": "gemini-3-pro-preview",
            "api_key_env": "GEMINI_API_KEY",
            "thinking_level": "high",
            "supports_cache": True,
            "description": "Gemini 3 Pro (High Thinking - Deep Reasoning)",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "gemini-3-flash-minimal": {
            "provider": "google",
            "model_name": "gemini-3-flash-preview",
            "api_key_env": "GEMINI_API_KEY",
            "thinking_level": "minimal",
            "supports_cache": False,
            "description": "Gemini 3 Flash (Minimal - Lowest Latency)",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "deepseek-v3": {
            "provider": "openai",
            "model_name": "deepseek-chat",
            "base_url": "https://api.deepseek.com",
            "api_key_env": "DEEPSEEK_API_KEY",
            "supports_cache": False,
            "description": "DeepSeek V3 (Cost Effective)",
            "pricing": {"input": 0.14, "output": 0.28}
        }
    }
    
    @staticmethod
    def _read_config() -> dict:
        """读取 models.yaml"""
        try:
            with open(ModelConfigService.CONFIG_PATH, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f) or {}
            return config.get("models", {})
        except Exception as e:
            print(f"❌ Read models.yaml failed: {e}")
            return {}
    
    @staticmethod
    def _write_config(models: dict) -> bool:
        """写入 models.yaml"""
        try:
            config = {"models": models}
            with open(ModelConfigService.CONFIG_PATH, "w", encoding="utf-8") as f:
                yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            return True
        except Exception as e:
            print(f"❌ Write models.yaml failed: {e}")
            return False
    
    @staticmethod
    def _backup_config() -> bool:
        """备份当前配置"""
        try:
            import shutil
            if ModelConfigService.CONFIG_PATH.exists():
                shutil.copy(ModelConfigService.CONFIG_PATH, ModelConfigService.CONFIG_BACKUP_PATH)
            return True
        except Exception:
            return False
    
    @staticmethod
    def list_models() -> list[dict]:
        """返回所有模型配置"""
        models = ModelConfigService._read_config()
        result = []
        for model_id, config in models.items():
            result.append({
                "id": model_id,
                **config
            })
        return result
    
    @staticmethod
    def get_model(model_id: str) -> Optional[dict]:
        """获取单个模型配置"""
        models = ModelConfigService._read_config()
        if model_id in models:
            return {"id": model_id, **models[model_id]}
        return None
    
    @staticmethod
    def create_model(model_id: str, config: dict) -> dict:
        """新增模型"""
        if not model_id:
            return {"success": False, "error": "模型 ID 不能为空"}
        
        models = ModelConfigService._read_config()
        
        if model_id in models:
            return {"success": False, "error": f"模型 {model_id} 已存在"}
        
        # 验证必填字段
        required = ["provider", "model_name", "api_key_env"]
        for field in required:
            if field not in config:
                return {"success": False, "error": f"缺少必填字段: {field}"}
        
        # 验证 provider
        if config["provider"] not in ["google", "openai"]:
            return {"success": False, "error": "provider 必须是 google 或 openai"}
        
        # 备份再写入
        ModelConfigService._backup_config()
        models[model_id] = config
        
        if ModelConfigService._write_config(models):
            return {"success": True, "message": f"模型 {model_id} 已创建"}
        return {"success": False, "error": "写入失败"}
    
    @staticmethod
    def update_model(model_id: str, config: dict) -> dict:
        """更新模型"""
        models = ModelConfigService._read_config()
        
        if model_id not in models:
            return {"success": False, "error": f"模型 {model_id} 不存在"}
        
        # 验证 provider
        if "provider" in config and config["provider"] not in ["google", "openai"]:
            return {"success": False, "error": "provider 必须是 google 或 openai"}
        
        # 备份再写入
        ModelConfigService._backup_config()
        models[model_id].update(config)
        
        if ModelConfigService._write_config(models):
            return {"success": True, "message": f"模型 {model_id} 已更新"}
        return {"success": False, "error": "写入失败"}
    
    @staticmethod
    def delete_model(model_id: str) -> dict:
        """删除模型"""
        models = ModelConfigService._read_config()
        
        if model_id not in models:
            return {"success": False, "error": f"模型 {model_id} 不存在"}
        
        # 备份再写入
        ModelConfigService._backup_config()
        del models[model_id]
        
        if ModelConfigService._write_config(models):
            return {"success": True, "message": f"模型 {model_id} 已删除"}
        return {"success": False, "error": "写入失败"}
    
    @staticmethod
    def reset_to_default() -> dict:
        """恢复默认配置"""
        try:
            ModelConfigService._backup_config()
            if ModelConfigService._write_config(ModelConfigService.DEFAULT_MODELS):
                return {"success": True, "message": "已恢复默认模型配置"}
            return {"success": False, "error": "写入失败"}
        except Exception as e:
            return {"success": False, "error": str(e)}
