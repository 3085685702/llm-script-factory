import os
import datetime
from google import genai
from google.genai import types
from . import llm_manager

class CacheManager:
    """
    Manages the lifecycle of Google GenAI Context Caching.
    Handles creation, TTL management, and token padding.
    Singleton-like usage recommended.
    """
    
    @staticmethod
    def _get_client(api_key):
        return genai.Client(api_key=api_key)

    @staticmethod
    def create_cache(api_key, model_name, display_name, system_instruction, context_contents, ttl_seconds=600):
        """
        Create a new cache.
        
        Args:
            api_key (str): API Key
            model_name (str): e.g. 'models/gemini-1.5-pro-001'
            display_name (str): e.g. 'stage2_cache_projectX'
            system_instruction (str): System prompt to bake into cache.
            context_contents (List[str]): List of logic segments (Theory, Context, etc.)
            ttl_seconds (int): Time to live.
            
        Returns:
            str: Cache Resource Name (e.g. 'cachedContents/xxxx')
        """
        client = CacheManager._get_client(api_key)
        
        # 1. Prepare Content
        # Gemini Cache expects contents list. Each item is a turn or part.
        # We usually wrap them as 'user' role parts.
        contents = [
            types.Content(role="user", parts=[types.Part(text=c)])
            for c in context_contents
        ]
        
        # 2. Token Padding Strategy (Optional but recommended for cost optimization tiers)
        # Assuming we just create simpler cache for now on Pro.
        # If content is < 32k, it might not be worth caching on some tiers, but Pro supports it.
        # We skip explicit padding logic here unless user requested "minimum token" enforcement.
        # Given prior context, there was a "validate_and_pad_contents" in old code. 
        # Standard approach: Just create it.
        
        cache_config = types.CreateCachedContentConfig(
            display_name=display_name,
            system_instruction=system_instruction,
            contents=contents,
            ttl=f"{ttl_seconds}s"
        )
        
        try:
            cache = client.caches.create(
                model=model_name,
                config=cache_config
            )
            return cache.name
        except Exception as e:
            # Propagate error to UI
            raise RuntimeError(f"Cache Creation Failed: {str(e)}")

    @staticmethod
    def get_cache_info(api_key, cache_name):
        """
        Get metadata about an existing cache.
        Returns None if not found or expired.
        """
        client = CacheManager._get_client(api_key)
        try:
            return client.caches.get(name=cache_name)
        except Exception:
            return None

    @staticmethod
    def list_caches(api_key):
        """List all active caches."""
        client = CacheManager._get_client(api_key)
        return list(client.caches.list())

    @staticmethod
    def delete_cache(api_key, cache_name):
        """Explicitly delete cache."""
        client = CacheManager._get_client(api_key)
        try:
            client.caches.delete(name=cache_name)
            return True
        except Exception:
            return False

    @staticmethod
    def update_cache_ttl(api_key, cache_name, ttl_seconds):
        """Update cache TTL (extend expiration time)."""
        client = CacheManager._get_client(api_key)
        try:
            client.caches.update(
                name=cache_name,
                config=types.UpdateCachedContentConfig(ttl=f"{ttl_seconds}s")
            )
            return True
        except Exception as e:
            print(f"Update Cache TTL Error: {e}")
            return False

    # =========================================================================
    # Service Layer Methods (封装方法，供 API Router 使用)
    # =========================================================================

    @staticmethod
    def get_google_api_key() -> str:
        """从 LLMManager 获取第一个 Google 模型的 API Key"""
        llm_mgr = llm_manager.LLMManager()
        for m_key, m_cfg in llm_mgr.config.get("models", {}).items():
            if m_cfg.get("provider") == "google":
                api_key_env = m_cfg.get("api_key_env")
                if api_key_env:
                    api_key = os.getenv(api_key_env)
                    if api_key:
                        return api_key
        raise ValueError("No Google API Key found in configuration")

    @staticmethod
    def list_caches_formatted() -> dict:
        """列表 + 格式化 + 统计"""
        api_key = CacheManager.get_google_api_key()
        caches = CacheManager.list_caches(api_key)
        
        formatted = []
        for c in caches:
            # Time formatting (UTC+8)
            expire_str = ""
            expire_raw = ""
            if hasattr(c, 'expire_time'):
                try:
                    ts = c.expire_time
                    if isinstance(ts, str):
                        ts = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    tz_beijing = datetime.timezone(datetime.timedelta(hours=8))
                    local_ts = ts.astimezone(tz_beijing)
                    expire_str = local_ts.strftime("%Y-%m-%d %H:%M:%S")
                    expire_raw = str(c.expire_time)
                except Exception:
                    expire_str = str(c.expire_time)
                    expire_raw = expire_str
            
            formatted.append({
                "name": c.name,
                "display_name": getattr(c, 'display_name', 'N/A'),
                "model": c.model.split("/")[-1] if hasattr(c, 'model') else "Unknown",
                "expire_time": expire_str,
                "expire_time_raw": expire_raw
            })
        
        return {
            "count": len(formatted),
            "caches": formatted
        }

    @staticmethod
    def delete_cache_by_name(cache_name: str) -> bool:
        """删除单个缓存（封装）"""
        api_key = CacheManager.get_google_api_key()
        return CacheManager.delete_cache(api_key, cache_name)

    @staticmethod
    def delete_all_caches() -> dict:
        """批量删除所有缓存"""
        api_key = CacheManager.get_google_api_key()
        caches = CacheManager.list_caches(api_key)
        
        success = 0
        failed = 0
        for c in caches:
            if CacheManager.delete_cache(api_key, c.name):
                success += 1
            else:
                failed += 1
        
        return {"success": success, "failed": failed, "total": len(caches)}

    @staticmethod
    def update_ttl_by_name(cache_name: str, ttl_seconds: int) -> bool:
        """更新缓存 TTL（封装）"""
        api_key = CacheManager.get_google_api_key()
        return CacheManager.update_cache_ttl(api_key, cache_name, ttl_seconds)

    @staticmethod
    def validate_cache_by_name(cache_name: str) -> dict:
        """
        验证缓存是否有效（存在且未过期）
        用于前端切换到 Google 模型时检查缓存状态
        
        Returns:
            dict: { valid: bool, expire_time?: str, display_name?: str, error?: str }
        """
        try:
            api_key = CacheManager.get_google_api_key()
            cache_info = CacheManager.get_cache_info(api_key, cache_name)
            
            if cache_info is None:
                return {"valid": False, "error": "缓存不存在或已过期"}
            
            # Extract expire time for display
            expire_str = ""
            if hasattr(cache_info, 'expire_time'):
                try:
                    ts = cache_info.expire_time
                    if isinstance(ts, str):
                        ts = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    tz_beijing = datetime.timezone(datetime.timedelta(hours=8))
                    local_ts = ts.astimezone(tz_beijing)
                    expire_str = local_ts.strftime("%Y-%m-%d %H:%M:%S")
                except Exception:
                    expire_str = str(cache_info.expire_time)
            
            return {
                "valid": True,
                "expire_time": expire_str,
                "display_name": getattr(cache_info, 'display_name', 'N/A')
            }
        except ValueError as e:
            return {"valid": False, "error": str(e)}
        except Exception as e:
            return {"valid": False, "error": f"验证失败: {str(e)}"}

