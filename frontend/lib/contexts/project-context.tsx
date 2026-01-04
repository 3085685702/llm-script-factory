"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"

export interface Project {
    name: string
    path: string
    updated_at: string
    stages: Record<string, boolean>
}

interface ProjectContextType {
    projects: Project[]
    activeProject: Project | null
    isLoading: boolean
    refreshProjects: () => Promise<void>
    setActiveProject: (project: Project | null) => void
    createProject: (name: string, description?: string) => Promise<boolean>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([])
    const [activeProject, setActiveProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const refreshProjects = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/api/common/projects")
            setProjects(res.projects)

            // Restore active project if exists in new list
            if (activeProject) {
                const stillExists = res.projects.find((p: Project) => p.name === activeProject.name)
                if (stillExists) {
                    setActiveProject(stillExists)
                } else {
                    setActiveProject(null)
                }
            } else if (res.projects.length > 0 && !activeProject) {
                // Optional: Auto-select first? Maybe not.
            }

        } catch (error) {
            console.error("Failed to fetch projects", error)
            toast.error("加载项目列表失败")
        } finally {
            setIsLoading(false)
        }
    }

    const createProject = async (name: string, description?: string) => {
        try {
            await api.post("/api/common/projects", { name, description })
            toast.success("项目创建成功")
            await refreshProjects()
            // Auto select new project
            const newProject = projects.find(p => p.name === name) // Try to find logic better, fetch again
            // Quick refresh was done.
            return true
        } catch (error: any) {
            toast.error(error.message || "创建项目失败")
            return false
        }
    }

    // Initial load
    useEffect(() => {
        refreshProjects()
    }, [])

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProject,
            isLoading,
            refreshProjects,
            setActiveProject,
            createProject
        }}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error("useProject must be used within a ProjectProvider")
    }
    return context
}
