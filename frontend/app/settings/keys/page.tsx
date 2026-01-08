"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Key, Check, X, Loader2, RotateCcw, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface KeyInfo {
    key_name: string;
    is_configured: boolean;
    masked_value: string;
}

export default function ApiKeysPage() {
    const [keys, setKeys] = React.useState<KeyInfo[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingKey, setEditingKey] = React.useState<string | null>(null);
    const [keyValue, setKeyValue] = React.useState("");
    const [showValue, setShowValue] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [validating, setValidating] = React.useState(false);

    // 加载 Keys 列表
    const loadKeys = async () => {
        setLoading(true);
        try {
            const res: any = await api.get("/api/settings/keys");
            setKeys(res.keys || []);
        } catch (err) {
            toast.error("加载失败");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadKeys();
    }, []);

    // 打开编辑对话框
    const handleEdit = (keyName: string) => {
        setEditingKey(keyName);
        setKeyValue("");
        setShowValue(false);
        setDialogOpen(true);
    };

    // 保存 Key
    const handleSave = async () => {
        if (!editingKey || !keyValue.trim()) {
            toast.error("请输入 Key 值");
            return;
        }

        setSaving(true);
        try {
            await api.put(`/api/settings/keys/${editingKey}`, { key_value: keyValue.trim() });
            toast.success(`${editingKey} 保存成功`);
            setDialogOpen(false);
            loadKeys();
        } catch (err: any) {
            toast.error(err?.detail || "保存失败");
        } finally {
            setSaving(false);
        }
    };

    // 验证 Key
    const handleValidate = async () => {
        if (!editingKey || !keyValue.trim()) {
            toast.error("请先输入 Key 值");
            return;
        }

        setValidating(true);
        try {
            const res: any = await api.post("/api/settings/keys/validate", {
                key_name: editingKey,
                key_value: keyValue.trim()
            });
            if (res.valid) {
                toast.success(res.message || "验证通过");
            } else {
                toast.error(res.message || "验证失败");
            }
        } catch (err: any) {
            toast.error("验证请求失败");
        } finally {
            setValidating(false);
        }
    };

    // 删除 Key
    const handleDelete = async (keyName: string) => {
        if (!confirm(`确定删除 ${keyName}？`)) return;

        try {
            await api.delete(`/api/settings/keys/${keyName}`);
            toast.success(`${keyName} 已删除`);
            loadKeys();
        } catch (err: any) {
            toast.error(err?.detail || "删除失败");
        }
    };

    // 恢复默认
    const handleReset = async () => {
        if (!confirm("确定恢复默认配置？现有 Key 将被清空。")) return;

        try {
            await api.post("/api/settings/keys/reset", {});
            toast.success("已恢复默认配置");
            loadKeys();
        } catch (err: any) {
            toast.error(err?.detail || "重置失败");
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Key className="w-8 h-8 text-blue-500" />
                    <div>
                        <h1 className="text-2xl font-bold">API Keys</h1>
                        <p className="text-sm text-slate-500">管理 LLM 服务的 API 密钥</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    恢复默认
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">变量名</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>掩码值</TableHead>
                            <TableHead className="text-right w-[150px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </TableCell>
                            </TableRow>
                        ) : keys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                                    暂无配置
                                </TableCell>
                            </TableRow>
                        ) : (
                            keys.map((k) => (
                                <TableRow key={k.key_name}>
                                    <TableCell className="font-mono text-sm">{k.key_name}</TableCell>
                                    <TableCell>
                                        {k.is_configured ? (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <Check className="w-4 h-4" /> 已配置
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-amber-500">
                                                <X className="w-4 h-4" /> 未设置
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-400">
                                        {k.masked_value || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(k.key_name)}
                                        >
                                            {k.is_configured ? "编辑" : "设置"}
                                        </Button>
                                        {k.is_configured && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(k.key_name)}
                                            >
                                                删除
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>设置 {editingKey}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Input
                                type={showValue ? "text" : "password"}
                                placeholder="输入 API Key"
                                value={keyValue}
                                onChange={(e) => setKeyValue(e.target.value)}
                                className="pr-10 font-mono"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowValue(!showValue)}
                            >
                                {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleValidate}
                            disabled={validating || !keyValue.trim()}
                            className="w-full"
                        >
                            {validating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ShieldCheck className="w-4 h-4 mr-2" />
                            )}
                            验证 Key
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !keyValue.trim()}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
