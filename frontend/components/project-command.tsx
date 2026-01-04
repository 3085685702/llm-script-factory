"use client";

import * as React from "react";
import { Search, FolderOpen, Clock, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type Project } from "@/lib/contexts/project-context";

interface ProjectCommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects: Project[];
    onSelect: (project: Project) => void;
    recentProjects?: Project[];
}

export function ProjectCommand({
    open,
    onOpenChange,
    projects,
    onSelect,
    recentProjects = [],
}: ProjectCommandProps) {
    const [search, setSearch] = React.useState("");
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Filter projects based on search
    const filteredProjects = React.useMemo(() => {
        if (!search.trim()) return projects;
        const lowerSearch = search.toLowerCase();
        return projects.filter(p =>
            p.name.toLowerCase().includes(lowerSearch)
        );
    }, [projects, search]);

    // Combined list: recent first (if no search), then all
    const displayList = React.useMemo(() => {
        if (search.trim()) {
            return filteredProjects;
        }
        // Show recent projects first, then all (excluding duplicates)
        const recentNames = new Set(recentProjects.map(p => p.name));
        const others = projects.filter(p => !recentNames.has(p.name));
        return [...recentProjects, ...others];
    }, [filteredProjects, recentProjects, projects, search]);

    // Reset selection when list changes
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [displayList]);

    // Focus input when dialog opens
    React.useEffect(() => {
        if (open) {
            setSearch("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < displayList.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case "Enter":
                e.preventDefault();
                if (displayList[selectedIndex]) {
                    onSelect(displayList[selectedIndex]);
                    onOpenChange(false);
                }
                break;
            case "Escape":
                onOpenChange(false);
                break;
        }
    };

    const handleSelect = (project: Project) => {
        onSelect(project);
        onOpenChange(false);
    };

    const recentCount = search.trim() ? 0 : recentProjects.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-md overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                        ref={inputRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="搜索项目... (⌘K)"
                        className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>

                {/* Project List */}
                <div className="max-h-80 overflow-y-auto py-2">
                    {displayList.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            未找到匹配的项目
                        </div>
                    ) : (
                        <>
                            {/* Recent Section */}
                            {recentCount > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} /> 最近使用
                                    </div>
                                    {displayList.slice(0, recentCount).map((project, index) => (
                                        <ProjectItem
                                            key={`recent-${project.name}`}
                                            project={project}
                                            isSelected={selectedIndex === index}
                                            onClick={() => handleSelect(project)}
                                        />
                                    ))}
                                    <div className="my-2 mx-3 h-px bg-border" />
                                </>
                            )}

                            {/* All Projects Section */}
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <FolderOpen size={12} />
                                {search.trim() ? `搜索结果 (${displayList.length})` : `所有项目 (${projects.length})`}
                            </div>
                            {displayList.slice(recentCount).map((project, index) => (
                                <ProjectItem
                                    key={project.name}
                                    project={project}
                                    isSelected={selectedIndex === recentCount + index}
                                    onClick={() => handleSelect(project)}
                                />
                            ))}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProjectItem({
    project,
    isSelected,
    onClick,
}: {
    project: Project;
    isSelected: boolean;
    onClick: () => void;
}) {
    const ref = React.useRef<HTMLDivElement>(null);

    // Scroll into view when selected
    React.useEffect(() => {
        if (isSelected && ref.current) {
            ref.current.scrollIntoView({ block: "nearest" });
        }
    }, [isSelected]);

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 mx-2 rounded-md cursor-pointer transition-colors",
                isSelected
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
            )}
        >
            <FolderOpen size={16} className="text-muted-foreground shrink-0" />
            <span className="flex-1 truncate text-sm">{project.name}</span>
            {isSelected && <ChevronRight size={14} className="text-muted-foreground" />}
        </div>
    );
}
