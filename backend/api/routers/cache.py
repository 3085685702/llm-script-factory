"""
Cache Manager API Router
管理 Google Context Cache，只负责转发，业务逻辑在 CacheManager
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.cache_manager import CacheManager

router = APIRouter(prefix="/api/cache", tags=["Cache"])


class TTLUpdateRequest(BaseModel):
    ttl_seconds: int


@router.get("/list")
async def list_caches() -> dict:
    """获取所有活跃缓存列表"""
    try:
        return CacheManager.list_caches_formatted()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取缓存列表失败: {str(e)}")


@router.delete("/{cache_name:path}")
async def delete_cache(cache_name: str) -> dict:
    """删除单个缓存"""
    try:
        success = CacheManager.delete_cache_by_name(cache_name)
        if success:
            return {"success": True, "message": f"缓存 {cache_name} 已删除"}
        else:
            raise HTTPException(status_code=500, detail="删除失败")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def delete_all_caches() -> dict:
    """删除所有缓存"""
    try:
        result = CacheManager.delete_all_caches()
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{cache_name:path}/ttl")
async def update_cache_ttl(cache_name: str, body: TTLUpdateRequest) -> dict:
    """更新缓存 TTL"""
    try:
        success = CacheManager.update_ttl_by_name(cache_name, body.ttl_seconds)
        if success:
            return {"success": True, "message": f"缓存 TTL 已更新为 {body.ttl_seconds} 秒"}
        else:
            raise HTTPException(status_code=500, detail="更新 TTL 失败")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validate/{cache_name:path}")
async def validate_cache(cache_name: str) -> dict:
    """
    验证缓存是否有效（存在且未过期）
    用于前端切换到 Google 模型时检查缓存状态
    """
    return CacheManager.validate_cache_by_name(cache_name)
