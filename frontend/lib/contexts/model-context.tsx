"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ModelSettings {
    model: string;
    temperature: number;
    useCache: boolean;
    cacheName?: string | null;
    cacheTTL: number; // 秒，最大 3600
}

interface ModelContextType {
    settings: ModelSettings;
    isLoading: boolean;
    updateSettings: (partial: Partial<ModelSettings>) => void;
}

const defaultSettings: ModelSettings = {
    model: "gemini-1.5-flash",
    temperature: 0.7,
    useCache: false,
    cacheTTL: 600
};

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const project = searchParams.get("project");

    // Determine current stage from pathname (e.g. /stage1 -> stage1)
    const getStageName = () => {
        if (pathname === "/") return "dashboard";
        const match = pathname.match(/^\/(stage\d+)/);
        return match ? match[1] : "unknown";
    };

    const [settings, setSettings] = useState<ModelSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(false);

    // Ref to track if we should save (avoid saving on initial load)
    const isFirstLoad = useRef(true);
    const lastSavedSettings = useRef<string>("");

    // Load settings when project or stage changes
    useEffect(() => {
        if (!project) return;

        const stage = getStageName();
        // Skip unknown stages or dashboard if no settings needed
        // But maybe dashboard has general settings? Let's check.

        setIsLoading(true);
        isFirstLoad.current = true;

        api.get(`/api/common/projects/${project}/settings`)
            .then((res: any) => {
                const stageSettings = res[stage] || {};
                const merged = { ...defaultSettings, ...stageSettings };
                setSettings(merged);
                lastSavedSettings.current = JSON.stringify(merged);
            })
            .catch(err => {
                console.error("Failed to load settings", err);
                toast.error("读取配置失败");
            })
            .finally(() => {
                setIsLoading(false);
                // After load, mark as not first load after a short tick
                setTimeout(() => { isFirstLoad.current = false; }, 100);
            });

    }, [project, pathname]);

    // Autosave when settings change
    // Using a simple effect with debounce logic implied by dependency change
    // For production, maybe use a real debounce hook.
    useEffect(() => {
        if (!project || isFirstLoad.current) return;

        const stage = getStageName();
        const currentStr = JSON.stringify(settings);

        if (currentStr === lastSavedSettings.current) return;

        const timer = setTimeout(() => {
            console.log("Saving settings...", settings);
            api.post(`/api/common/projects/${project}/settings`, {
                settings: { [stage]: settings } // Partial update for this stage
            })
                .then(() => {
                    lastSavedSettings.current = JSON.stringify(settings);
                    // toast.success("配置已同步"); // Too noisy?
                })
                .catch(err => {
                    toast.error("配置保存失败");
                });
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [settings, project, pathname]);

    const updateSettings = useCallback((partial: Partial<ModelSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    return (
        <ModelContext.Provider value={{ settings, isLoading, updateSettings }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModelSettings() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error("useModelSettings must be used within a ModelProvider");
    }
    return context;
}
