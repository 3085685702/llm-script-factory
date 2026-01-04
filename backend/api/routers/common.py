from fastapi import APIRouter, HTTPException, Body
from typing import Dict
import datetime

from api.schemas import ProjectListResponse, ProjectCreate, SystemUsageResponse, SettingsUpdate
from services.project_service import ProjectService
from services.model_service import ModelService
from services.usage_service import UsageService
from services.archive_service import ArchiveService
from utils.debug_manager import DebugManager

router = APIRouter(prefix="/api/common", tags=["common"])
project_service = ProjectService()
model_service = ModelService()
usage_service = UsageService()
archive_service = ArchiveService()

@router.get("/models")
def list_models():
    """List available AI models from config."""
    return {"models": model_service.get_available_models()}

@router.get("/projects", response_model=ProjectListResponse)
def list_projects():
    """List all available projects and their stage status."""
    return {"projects": project_service.list_projects()}

@router.post("/projects")
def create_project(payload: ProjectCreate):
    """Create a new project workspace."""
    try:
        project_service.create_project(payload.name, payload.description)
        return {"success": True, "message": f"Project {payload.name} created."}
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{name}")
def delete_project(name: str):
    """Delete a project and all its contents permanently."""
    try:
        project_service.delete_project(name)
        return {"success": True, "message": f"Project '{name}' has been deleted."}
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{name}/archive")
def archive_project(name: str):
    """Archive a project to backup/ directory with version numbering."""
    try:
        archived_path = archive_service.archive_project(name)
        return {"success": True, "archived_path": archived_path}
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{name}/settings")
def get_project_settings(name: str):
    """Get project specific settings."""
    return project_service.get_settings(name)

@router.post("/projects/{name}/settings")
def update_project_settings(name: str, payload: SettingsUpdate):
    """Update project settings."""
    try:
        updated = project_service.update_settings(name, payload.settings)
        return {"success": True, "settings": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage", response_model=SystemUsageResponse)
def get_usage_stats():
    """Get aggregated token usage for today."""
    return usage_service.get_todays_usage()
