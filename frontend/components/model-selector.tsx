"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Zap, Archive, Settings2, Loader2, Database, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useModelSettings } from "@/lib/contexts/model-context";
import { useProject } from "@/lib/contexts/project-context";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ModelOption {
    id: string;
    name: string;
    provider: string;
    thinking_level?: string;
    supports_cache?: boolean;
}

export function ModelSelector() {
    const { settings, updateSettings, isLoading } = useModelSettings();
    const { activeProject } = useProject();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(true);
    const [models, setModels] = React.useState<ModelOption[]>([]);
    const [fetchingModels, setFetchingModels] = React.useState(false);
    const [buildingCache, setBuildingCache] = React.useState(false);
    const [validatingCache, setValidatingCache] = React.useState(false);
    const prevModelRef = React.useRef<string | null>(null);

    // Load available models from backend
    React.useEffect(() => {
        setFetchingModels(true);
        api.get("/api/common/models")
            .then((res: any) => {
                if (res.models) {
                    setModels(res.models);
                }
            })
            .catch(err => {
                console.error("Failed to load models", err);
            })
            .finally(() => setFetchingModels(false));
    }, []);

    // Extract current stage/page from pathname (e.g., /stage3 -> "stage3", /import -> "import")
    const getCurrentStage = (): string | null => {
        // Match /stageN or /import
        const stageMatch = pathname?.match(/\/(stage\d)/);
        if (stageMatch) return stageMatch[1];

        if (pathname?.includes("/import")) return "import";

        return null;
    };

    const handleBuildCache = async () => {
        const stage = getCurrentStage();
        if (!stage) {
            toast.error("请先进入某个 Stage 或 Import 页面");
            return;
        }
        if (!activeProject) {
            toast.error("请先选择项目");
            return;
        }
        if (!settings.model) {
            toast.error("请先选择模型");
            return;
        }

        setBuildingCache(true);
        try {
            // Stage 1 has special handling (synopsis/rough)
            let endpoint = `/api/${stage}/cache/build`;
            let payload: any = {
                project: activeProject.name,
                project_name: activeProject.name,  // Some endpoints use this
                model_key: settings.model,
                ttl_seconds: settings.cacheTTL || 600
            };

            // Stage 1 now uses unified cache (no need for separate synopsis/rough)
            if (stage === "stage1") {
                toast.info("正在构建 Stage 1 统一缓存...");
                const res: any = await api.post(endpoint, payload);
                if (res.success) {
                    toast.success("Stage 1 缓存构建成功");
                    updateSettings({ cacheName: res.cache_name });
                } else {
                    throw new Error("缓存构建失败");
                }
            } else if (stage === "import") {
                // Import uses longer TTL (3600s) for large script content
                payload.ttl_seconds = settings.cacheTTL || 3600;
                toast.info("正在构建 Import 缓存 (含全部剧本)...");
                const res: any = await api.post(endpoint, payload);
                if (res.success) {
                    toast.success("Import 缓存构建成功");
                    updateSettings({ cacheName: res.cache_name });
                } else {
                    throw new Error(res.detail || "缓存构建失败");
                }
            } else {
                toast.info(`正在构建 ${stage.toUpperCase()} 缓存...`);
                const res: any = await api.post(endpoint, payload);
                if (res.success) {
                    toast.success(`${stage.toUpperCase()} 缓存构建成功`);
                    updateSettings({ cacheName: res.cache_name });
                } else {
                    throw new Error(res.detail || "缓存构建失败");
                }
            }
        } catch (err: any) {
            console.error("Cache build error:", err);
            const errorMsg = typeof err === 'string'
                ? err
                : err?.message || err?.detail || JSON.stringify(err) || "缓存构建失败";
            toast.error(errorMsg);
        } finally {
            setBuildingCache(false);
        }
    };

    // Check if current model supports cache
    const currentModel = models.find(m => m.id === settings.model);
    const currentModelSupportsCache = currentModel?.supports_cache ?? false;

    // Auto-disable cache if model doesn't support it
    React.useEffect(() => {
        if (settings.useCache && !currentModelSupportsCache && models.length > 0) {
            updateSettings({ useCache: false });
            toast.warning("当前模型不支持缓存，已自动关闭");
        }
    }, [settings.model, currentModelSupportsCache, models.length]);

    // Validate cache when switching TO a Google model
    React.useEffect(() => {
        const prevModel = prevModelRef.current;
        prevModelRef.current = settings.model;

        // Skip initial render or if no previous model
        if (!prevModel || !settings.model || prevModel === settings.model) return;

        // Check if we're switching TO a Google model
        const prevModelConfig = models.find(m => m.id === prevModel);
        const currModelConfig = models.find(m => m.id === settings.model);

        const wasGoogle = prevModelConfig?.provider === "google";
        const isNowGoogle = currModelConfig?.provider === "google";

        // If switching to Google + cache is enabled + cacheName exists -> validate
        if (!wasGoogle && isNowGoogle && settings.useCache && settings.cacheName) {
            setValidatingCache(true);
            api.get(`/api/cache/validate/${encodeURIComponent(settings.cacheName)}`)
                .then((res: any) => {
                    if (!res.valid) {
                        toast.warning(`⚠️ 缓存已失效: ${res.error || '请重新构建缓存'}`, {
                            duration: 5000,
                            action: {
                                label: "重建缓存",
                                onClick: () => handleBuildCache()
                            }
                        });
                        // Clear invalid cache name
                        updateSettings({ cacheName: null });
                    } else {
                        toast.success(`✅ 缓存有效，过期时间: ${res.expire_time}`);
                    }
                })
                .catch(err => {
                    console.error("Cache validation error:", err);
                })
                .finally(() => setValidatingCache(false));
        }
    }, [settings.model, models]);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mt-auto border-t bg-slate-50/50 dark:bg-slate-900/50"
        >
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <div className="flex items-center gap-2">
                    <Settings2 size={14} />
                    <span>AI Configuration</span>
                </div>
                <div className="flex items-center gap-2">
                    {(isLoading || fetchingModels) && <Loader2 size={12} className="animate-spin" />}
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 px-4 pb-4">
                {/* Model Select */}
                <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium uppercase">Model Engine</label>
                    <Select
                        value={settings.model}
                        onValueChange={(val) => updateSettings({ model: val })}
                        disabled={isLoading || fetchingModels}
                    >
                        <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] w-[220px]">
                            {models.length > 0 ? models.map(m => (
                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            m.id.includes("flash") ? "bg-amber-400" :
                                                m.id.includes("pro") ? "bg-blue-400" : "bg-slate-400"
                                        )} />
                                        <span className="truncate max-w-[180px]" title={m.name}>{m.name}</span>
                                    </div>
                                </SelectItem>
                            )) : (
                                <div className="p-2 text-xs text-slate-400 text-center">Loading models...</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Temperature */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 font-medium uppercase">Creativity</label>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{settings.temperature}</span>
                    </div>
                    <Slider
                        value={[settings.temperature]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([val]) => updateSettings({ temperature: val })}
                        className="py-1"
                    />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-800" />

                {/* Cache Control */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database size={14} className={settings.useCache ? "text-green-500" : "text-slate-400"} />
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Context Cache</label>
                            {!currentModelSupportsCache && (
                                <span className="text-[10px] text-amber-500">(模型不支持)</span>
                            )}
                        </div>
                        <Switch
                            checked={settings.useCache}
                            onCheckedChange={(val) => updateSettings({ useCache: val })}
                            disabled={!currentModelSupportsCache}
                            className="scale-75 origin-right"
                        />
                    </div>

                    {/* Warning: Non-Google model with cache conceptually enabled (settings residue) */}
                    {currentModel && currentModel.provider !== "google" && settings.cacheName && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                            <span className="text-amber-600 dark:text-amber-400 text-xs">
                                ⚠️ 当前模型不支持缓存，请求将直接发送（缓存不会被使用）
                            </span>
                        </div>
                    )}

                    {/* Cache TTL */}
                    {settings.useCache && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 shrink-0">TTL:</label>
                            <input
                                type="number"
                                value={settings.cacheTTL}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    if (val > 3600) {
                                        toast.error("TTL 不能超过 3600 秒");
                                        return;
                                    }
                                    updateSettings({ cacheTTL: val });
                                }}
                                max={3600}
                                min={1}
                                className="w-20 h-6 px-2 text-xs border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            />
                            <span className="text-xs text-slate-400">秒 (max 3600)</span>
                        </div>
                    )}

                    {/* Explicit Cache Build Button - Always visible but styled based on state */}
                    <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                            "w-full h-8 text-xs gap-1.5 transition-colors",
                            settings.useCache
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                : "opacity-50 grayscale"
                        )}
                        onClick={handleBuildCache}
                        disabled={!settings.useCache || isLoading || buildingCache}
                        title={!settings.useCache ? "Enable Cache to build" : "Initialize or Refresh Cache"}
                    >
                        <RefreshCw size={12} className={buildingCache ? "animate-spin" : ""} />
                        {buildingCache ? "构建中..." : "Build / Refresh Cache"}
                    </Button>

                    {settings.cacheName && settings.useCache && (
                        <div className="text-[10px] text-green-600/80 text-center truncate px-1">
                            Current: {settings.cacheName}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
