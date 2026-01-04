"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Zap, RefreshCw, Trash2, Clock, Database } from "lucide-react";

// --- Types ---
interface CacheEntry {
    name: string;
    display_name: string;
    model: string;
    expire_time: string;
    expire_time_raw: string;
}

export default function CachePage() {
    // Data State
    const [caches, setCaches] = useState<CacheEntry[]>([]);
    const [count, setCount] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingTTL, setIsUpdatingTTL] = useState(false);
    const [selectedTTL, setSelectedTTL] = useState("600"); // 10 min default

    // Load on mount
    useEffect(() => {
        loadCaches();
    }, []);

    const loadCaches = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/api/cache/list");
            setCaches(res.caches || []);
            setCount(res.count || 0);
            setSelectedIndex(res.caches?.length > 0 ? 0 : null);
        } catch (e: any) {
            toast.error("加载缓存列表失败: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (cacheName: string) => {
        setIsDeleting(true);
        try {
            await api.delete(`/api/cache/${encodeURIComponent(cacheName)}`);
            toast.success("缓存已删除");
            loadCaches();
        } catch (e: any) {
            toast.error("删除失败: " + e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const res = await api.delete("/api/cache/");
            toast.success(`已清空 ${res.success}/${res.total} 个缓存`);
            loadCaches();
        } catch (e: any) {
            toast.error("清空失败: " + e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateTTL = async (cacheName: string) => {
        const ttlNum = parseInt(selectedTTL);
        if (isNaN(ttlNum) || ttlNum <= 0) {
            toast.error("TTL 必须是正整数");
            return;
        }
        if (ttlNum > 3600) {
            toast.error("TTL 不能超过 3600 秒");
            return;
        }
        setIsUpdatingTTL(true);
        try {
            await api.patch(`/api/cache/${encodeURIComponent(cacheName)}/ttl`, {
                ttl_seconds: ttlNum
            });
            toast.success(`TTL 已更新为 ${ttlNum} 秒`);
            loadCaches();
        } catch (e: any) {
            toast.error("更新 TTL 失败: " + e.message);
        } finally {
            setIsUpdatingTTL(false);
        }
    };

    const selectedCache = selectedIndex !== null ? caches[selectedIndex] : null;

    // --- Render ---
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Zap className="text-amber-500" />
                        <div>
                            <h1 className="text-xl font-bold">Cache Manager</h1>
                            <p className="text-sm text-slate-500">管理 Google Context Cache</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={loadCaches} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            刷新
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={count === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    清空全部
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认清空所有缓存？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        此操作将删除所有 {count} 个活跃缓存，无法恢复。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAll}>确认清空</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>活跃缓存: <strong className="text-slate-700 dark:text-slate-300">{count}</strong></span>
                </div>
            </div>

            {/* Main Content: Master-Detail Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Cache List */}
                <div className="w-80 border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shrink-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2" />
                                    加载中...
                                </div>
                            ) : caches.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Database size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>暂无活跃缓存</p>
                                </div>
                            ) : (
                                caches.map((cache, idx) => {
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <button
                                            key={cache.name}
                                            onClick={() => setSelectedIndex(idx)}
                                            className={`w-full text-left p-3 rounded-lg transition-all ${isSelected
                                                ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 border'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap size={14} className="text-amber-500" />
                                                <span className="text-sm font-medium truncate flex-1">{cache.display_name || 'N/A'}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{cache.model}</p>
                                            <p className="text-xs text-slate-400">过期: {cache.expire_time}</p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Detail Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedCache ? (
                        <div className="p-6 space-y-6">
                            {/* Cache Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Display Name</label>
                                    <p className="text-lg font-semibold">{selectedCache.display_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Model</label>
                                    <p className="font-mono">{selectedCache.model}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Resource Name</label>
                                    <p className="font-mono text-sm text-slate-600 break-all">{selectedCache.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">过期时间</label>
                                    <p className="flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" />
                                        {selectedCache.expire_time}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-6 space-y-4">
                                {/* Update TTL */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-slate-600 shrink-0">刷新 TTL:</label>
                                    <Input
                                        type="number"
                                        value={selectedTTL}
                                        onChange={(e) => setSelectedTTL(e.target.value)}
                                        placeholder="秒数 (Max 3600s)"
                                        className="w-32"
                                        max={3600}
                                        min={1}
                                    />
                                    <span className="text-sm text-slate-400">秒</span>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleUpdateTTL(selectedCache.name)}
                                        disabled={isUpdatingTTL}
                                    >
                                        {isUpdatingTTL ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                                        更新
                                    </Button>
                                </div>

                                {/* Delete */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isDeleting}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            删除此缓存
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认删除缓存？</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                将删除缓存: {selectedCache.display_name}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(selectedCache.name)}>确认删除</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <Database size={48} className="mx-auto mb-4 opacity-30" />
                                <p>{caches.length === 0 ? "暂无缓存" : "选择左侧缓存查看详情"}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
