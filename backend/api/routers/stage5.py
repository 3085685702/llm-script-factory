"""
Stage 5 API Router: Script Polisher
Refactored with clear cache build endpoint.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from services.stage5_polisher import Stage5Service
from services.project_service import ProjectService
from utils.file_manager import FileManager
from api.schemas import GenerateBatchRequest, SaveScriptsRequest, BuildCacheRequest

router = APIRouter(prefix="/api/stage5", tags=["Stage5"])

# Service instances
stage5_service = Stage5Service()
project_service = ProjectService()


# --- Helper ---
def get_project_path(project_name: str, relative_path: str) -> str:
    """Get absolute path for a file in a project."""
    project_root = project_service.get_project_path(project_name)
    return f"{project_root}/{relative_path}"


# =============================================================================
# CACHE BUILD ENDPOINT
# =============================================================================

@router.post("/cache/build")
async def build_cache(request: BuildCacheRequest) -> dict:
    """Build cache for Stage 5."""
    try:
        cache_name = stage5_service.build_cache(
            model_key=request.model_key,
            project_name=request.project,
            ttl_seconds=request.ttl_seconds
        )
        return {"success": True, "cache_name": cache_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# DATA LOADING
# =============================================================================

@router.get("/scripts")
async def get_scripts(project: str) -> dict:
    """获取已精修的剧本列表"""
    path = get_project_path(project, "5_scripts/refined_scripts.json")
    scripts = FileManager.load_json(path, default=[])
    return {"scripts": scripts, "count": len(scripts)}


@router.get("/s4-scripts")
async def get_s4_scripts(project: str) -> dict:
    """获取 Stage 4 剧本草稿 (作为精修输入)"""
    path = get_project_path(project, "4_scripts/script_drafts.json")
    scripts = FileManager.load_json(path, default=[])
    return {"scripts": scripts, "count": len(scripts)}


@router.get("/registry")
async def get_registry(project: str) -> dict:
    """获取角色出场注册表"""
    path = get_project_path(project, "5_scripts/character_registry.json")
    registry = FileManager.load_json(path, default={})
    return {"registry": registry}


# =============================================================================
# GENERATION
# =============================================================================

@router.post("/generate")
async def generate_batch(request: GenerateBatchRequest) -> dict:
    """Generate batch of polished scripts (auto-detects cache from settings)."""
    try:
        result = stage5_service.generate_batch(
            project_name=request.project,
            start_ep=request.start_ep,
            end_ep=request.end_ep
        )
        return {"success": True, "episodes": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SAVING
# =============================================================================

@router.post("/save")
async def save_scripts(request: SaveScriptsRequest) -> dict:
    """Save/update polished scripts (Upsert by ep_id)."""
    try:
        success = stage5_service.save_batch(
            project_name=request.project,
            new_batch=request.scripts
        )
        if success:
            return {"success": True, "message": f"已保存 {len(request.scripts)} 集精修剧本"}
        else:
            raise HTTPException(status_code=500, detail="保存失败")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_name}/scripts")
async def clear_all_scripts(project_name: str):
    """Clear all refined scripts for a project."""
    try:
        success = stage5_service.clear_all_scripts(project_name)
        return {"success": success, "message": "All scripts cleared"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# COPY FROM PREVIOUS STAGE
# =============================================================================

@router.post("/copy-from-s4")
async def copy_from_s4(project: str) -> dict:
    """Copy Stage 4 scripts to Stage 5 (reset/initialize)."""
    try:
        result = stage5_service.copy_from_s4(project)
        return {"success": True, "message": f"已从 Stage 4 拷贝 {result['count']} 集到 Stage 5"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-needs-init")
async def check_needs_init(project: str) -> dict:
    """Check if Stage 5 needs initialization from Stage 4."""
    try:
        return stage5_service.check_needs_init(project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


