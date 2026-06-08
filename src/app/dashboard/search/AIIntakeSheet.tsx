"use client";

import { Button } from "@/components/ui/tahoe-ui";
import { Cross2Icon } from "@/components/ui/icons";
import { AIIntakeContent, type AIIntakeSurfaceProps } from "./AIIntakeDrawer";
import styles from "./langgraph-search.module.css";

export default function AIIntakeSheet({
    onCollapse,
    ...props
}: AIIntakeSurfaceProps) {
    return (
        <>
            <div className={styles.aiSheetOverlay} onClick={onCollapse} aria-hidden="true" />
            <aside
                className={styles.aiIntakeSheet}
                role="dialog"
                aria-modal="true"
                aria-label="AI Search Assistant"
            >
                <div className={styles.bottomSheetHandle} aria-hidden="true" />
                <div className={styles.aiSheetCloseRow}>
                    <span />
                    {onCollapse ? (
                        <Button size="1" variant="ghost" onClick={onCollapse} aria-label="Close AI assistant">
                            <Cross2Icon />
                        </Button>
                    ) : null}
                </div>
                <AIIntakeContent {...props} onCollapse={onCollapse} />
            </aside>
        </>
    );
}
