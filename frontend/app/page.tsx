"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FolderPlus, CheckCircle2, Circle, ArrowRight, Trash2, Archive } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Project {
  name: string;
  path: string;
  updated_at: string;
  stages: Record<string, boolean>;
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentProjectName = searchParams.get("project");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  // Create Project State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  // Delete/Archive Project State
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentProjectName) {
      loadProjectDetails(currentProjectName);
    } else {
      setProject(null);
    }
  }, [currentProjectName]);

  const loadProjectDetails = async (name: string) => {
    setLoading(true);
    try {
      // Temporarily fetching list and filtering. 
      // Ideal: GET /api/common/projects/{name}
      const res: any = await api.get("/api/common/projects");
      const found = res.projects?.find((p: Project) => p.name === name);
      if (found) setProject(found);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("项目名称不能为空");
      return;
    }

    setIsCreating(true);
    try {
      const res: any = await api.post("/api/common/projects", {
        name: newProjectName,
        description: newProjectDesc
      });

      if (res.success) {
        toast.success("项目创建成功");
        setIsDialogOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        // Refresh by navigating to the new project
        router.push(`/?project=${encodeURIComponent(newProjectName)}`);
        // Force reload to update Sidebar (since they don't share context yet)
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (e: any) {
      // e is unknown, try to check if it's an Error object or parsed JSON
      const msg = e.message || String(e);
      toast.error("创建失败: " + msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/common/projects/${encodeURIComponent(project.name)}`);
      toast.success("项目已删除");
      // Navigate to home without project selected
      router.push("/");
      // Force reload to update Sidebar
      setTimeout(() => window.location.reload(), 300);
    } catch (e: any) {
      const msg = e.message || String(e);
      toast.error("删除失败: " + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    try {
      const res: any = await api.post(`/api/common/projects/${encodeURIComponent(project.name)}/archive`, {});
      toast.success(`项目已归档到: ${res.archived_path}`);
      // Navigate to home without project selected
      router.push("/");
      // Force reload to update Sidebar
      setTimeout(() => window.location.reload(), 300);
    } catch (e: any) {
      const msg = e.message || String(e);
      toast.error("归档失败: " + msg);
    } finally {
      setIsArchiving(false);
    }
  };

  const stageMap: Record<string, string> = {
    "1_idea": "创意孵化",
    "2_structure": "结构构建",
    "3_scene": "分场编写",
    "4_script": "剧本撰写",
    "5_refine": "润色优化",
    "6_doctor": "剧本医生"
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      {/* Welcome Header */}
      <div className="text-center space-y-2 relative w-full max-w-2xl">
        <div className="text-6xl animate-bounce">🎬</div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Script Factory AI</h1>
        <p className="text-slate-500">全流程 AI 短剧创作工作站</p>

      </div>

      {/* Main Action Area */}
      <div className="w-full max-w-2xl grid gap-6">

        {/* Case 1: No Project Selected */}
        {!project && (
          <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 gap-4">
              <p className="text-slate-500">还没有选择项目？</p>
              <div className="flex gap-4">
                <p className="text-sm text-slate-400 self-center">← 请在左侧选择</p>
                <span className="text-slate-300">|</span>
                <Button variant="default" className="gap-2" onClick={() => setIsDialogOpen(true)}>
                  <FolderPlus size={16} />
                  新建项目
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case 2: Project Selected - Preview */}
        {project && (
          <Card className="shadow-lg border-blue-100 dark:border-blue-900 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-blue-900 dark:text-blue-100">{project.name}</CardTitle>
                  <CardDescription className="font-mono text-xs mt-1 text-slate-400">{project.path}</CardDescription>
                </div>
                <Badge variant="outline">{project.updated_at.split('T')[0]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stages Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stageMap).map(([key, label]) => {
                  const isDone = project.stages[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-md border ${isDone
                        ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400"
                        : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900/50 dark:border-slate-800"
                        }`}
                    >
                      {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" disabled>
                  打开文件夹
                </Button>
                {/* Archive Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                      <Archive size={16} />
                      归档
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认归档项目？</AlertDialogTitle>
                      <AlertDialogDescription>
                        项目 <span className="font-semibold">"{project.name}"</span> 将被移动到 <span className="font-mono text-xs">backup/</span> 目录。如需恢复，可手动将文件夹移回 <span className="font-mono text-xs">projects/</span> 目录。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleArchiveProject}
                        disabled={isArchiving}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {isArchiving ? "归档中..." : "确认归档"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                      <Trash2 size={16} />
                      删除项目
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将<span className="text-red-600 font-semibold">永久删除</span>项目 <span className="font-semibold">"{project.name}"</span> 及其所有内容，包括剧本、设定等所有数据。此操作不可恢复。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProject}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "删除中..." : "确认删除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/stage6?project=${encodeURIComponent(project.name)}`)}>
                  进入 Script Doctor
                  <ArrowRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
