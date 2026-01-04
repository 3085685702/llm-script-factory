import os
import json
from typing import Optional, Dict, Any, Tuple

class FileManager:
    """
    Centralized I/O Controller.
    Refactored for FastAPI Backend (Stateless).
    """
    
    @staticmethod
    def load_json(path: str, default: Optional[Any] = None) -> Any:
        """
        Load JSON from absolute path.
        """
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading JSON from {path}: {e}")
                return default
        return default

    @staticmethod
    def save_json(path: str, data: Any) -> bool:
        """
        Save JSON to absolute path.
        Auto-creates directories.
        """
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving JSON to {path}: {e}")
            return False

    @staticmethod
    def validate_json(data: Any, schema_path_relative: str) -> Tuple[bool, str]:
        """
        Validate data against a schema file.
        schema_path_relative: path relative to backend root (e.g. 'prompts/stage1/schema_step1.json')
        """
        # Resolve schema path relative to backend root
        backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        schema_path = os.path.join(backend_root, schema_path_relative)

        if not os.path.exists(schema_path):
             return False, f"Schema file not found: {schema_path}"
             
        try:
            with open(schema_path, "r", encoding="utf-8") as f:
                schema = json.load(f)
            return FileManager._validate_schema_logic(data, schema)
        except Exception as e:
            return False, f"Validation Error: {str(e)}"

    @staticmethod
    def _validate_schema_logic(data: Any, schema: Any) -> Tuple[bool, str]:
        """
        Custom recursive validator.
        Supports basic type checking and required fields.
        """
        # 1. Handle Array Type
        if schema.get("type") == "array":
            if not isinstance(data, list):
                return False, "Expected a list (array), got something else."
            
            item_schema = schema.get("items")
            if item_schema:
                for idx, item in enumerate(data):
                    valid, msg = FileManager._validate_schema_logic(item, item_schema)
                    if not valid:
                        return False, f"Item {idx}: {msg}"
            return True, "Valid"

        # 2. Handle Object Type
        if isinstance(schema, dict):
            # Check required fields
            if "required" in schema and isinstance(schema["required"], list):
                for req in schema["required"]:
                    if req not in data:
                        return False, f"Missing required field: '{req}'"
            
            # Recursive check for properties
            properties = schema.get("properties")
            if properties and isinstance(properties, dict) and isinstance(data, dict):
                for key, prop_schema in properties.items():
                    if key in data:
                        valid, msg = FileManager._validate_schema_logic(data[key], prop_schema)
                        if not valid:
                            return False, f"Key '{key}': {msg}"
                            
        return True, "Valid"
