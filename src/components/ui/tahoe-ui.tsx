"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type SizeToken = string | number | undefined;
type WeightToken = "regular" | "medium" | "bold" | string | undefined;
type ColorToken = "gray" | "red" | "orange" | "amber" | "blue" | "green" | string | undefined;
type VariantToken = "solid" | "soft" | "ghost" | "outline" | undefined;

const SPACE_MAP: Record<string, string> = {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "24px",
    "6": "32px",
    "7": "40px",
    "8": "48px",
    "9": "64px",
};

const TEXT_SIZE_MAP: Record<string, string> = {
    "1": "12px",
    "2": "15px",
    "3": "18px",
    "4": "24px",
    "5": "32px",
};

function resolveSpace(value: SizeToken) {
    if (value == null) return undefined;
    if (typeof value === "number") return `${value}px`;
    return SPACE_MAP[value] ?? value;
}

function resolveFontSize(value: SizeToken) {
    if (value == null) return undefined;
    if (typeof value === "number") return `${value}px`;
    return TEXT_SIZE_MAP[value] ?? value;
}

function resolveWeight(value: WeightToken) {
    if (!value) return undefined;
    if (value === "regular") return 400;
    if (value === "medium") return 500;
    if (value === "bold") return 600;
    return value;
}

function resolveColor(value: ColorToken) {
    if (!value) return undefined;
    if (value === "gray") return "var(--tahoe-color-text-secondary)";
    if (value === "red") return "var(--tahoe-color-danger)";
    if (value === "orange" || value === "amber") return "var(--tahoe-color-accent)";
    if (value === "blue") return "#0f6ad8";
    if (value === "green") return "var(--tahoe-color-success)";
    return value;
}

function resolveFlexAlign(value: React.CSSProperties["alignItems"]) {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    return value;
}

function resolveFlexJustify(value: React.CSSProperties["justifyContent"]) {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    if (value === "between") return "space-between";
    if (value === "around") return "space-around";
    if (value === "evenly") return "space-evenly";
    return value;
}

function mergeStyles(
    base: React.CSSProperties,
    props: {
        m?: SizeToken;
        mt?: SizeToken;
        mb?: SizeToken;
        ml?: SizeToken;
        mr?: SizeToken;
        mx?: SizeToken;
        my?: SizeToken;
        p?: SizeToken;
        pt?: SizeToken;
        pb?: SizeToken;
        pl?: SizeToken;
        pr?: SizeToken;
        px?: SizeToken;
        py?: SizeToken;
        gap?: SizeToken;
        rowGap?: SizeToken;
        columnGap?: SizeToken;
        style?: React.CSSProperties;
    },
) {
    const style: React.CSSProperties = { ...base };
    const assign = (key: keyof React.CSSProperties, value: SizeToken) => {
        const resolved = resolveSpace(value);
        if (resolved !== undefined) {
            (style as Record<string, string | number | undefined>)[key as string] = resolved;
        }
    };
    assign("margin", props.m);
    assign("marginTop", props.mt ?? props.my);
    assign("marginBottom", props.mb ?? props.my);
    assign("marginLeft", props.ml ?? props.mx);
    assign("marginRight", props.mr ?? props.mx);
    assign("padding", props.p);
    assign("paddingTop", props.pt ?? props.py);
    assign("paddingBottom", props.pb ?? props.py);
    assign("paddingLeft", props.pl ?? props.px);
    assign("paddingRight", props.pr ?? props.px);
    assign("gap", props.gap);
    assign("rowGap", props.rowGap);
    assign("columnGap", props.columnGap);
    return { ...style, ...(props.style ?? {}) };
}

type CommonLayoutProps = {
    as?: React.ElementType;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    m?: SizeToken;
    mt?: SizeToken;
    mb?: SizeToken;
    ml?: SizeToken;
    mr?: SizeToken;
    mx?: SizeToken;
    my?: SizeToken;
    p?: SizeToken;
    pt?: SizeToken;
    pb?: SizeToken;
    pl?: SizeToken;
    pr?: SizeToken;
    px?: SizeToken;
    py?: SizeToken;
    gap?: SizeToken;
    rowGap?: SizeToken;
    columnGap?: SizeToken;
};

export function Box({
    as = "div",
    className,
    style,
    children,
    ...spacing
}: CommonLayoutProps & React.HTMLAttributes<HTMLElement>) {
    const Component = as as React.ElementType;
    return (
        <Component className={className} style={mergeStyles({}, { ...spacing, style })}>
            {children}
        </Component>
    );
}

export function Flex({
    as = "div",
    className,
    style,
    children,
    align,
    justify,
    direction,
    wrap,
    ...spacing
}: CommonLayoutProps &
    React.HTMLAttributes<HTMLElement> & {
        align?: React.CSSProperties["alignItems"];
        justify?: React.CSSProperties["justifyContent"];
        direction?: React.CSSProperties["flexDirection"];
        wrap?: React.CSSProperties["flexWrap"];
    }) {
    const Component = as as React.ElementType;
    return (
        <Component
            className={["tui-flex", className].filter(Boolean).join(" ")}
            style={mergeStyles(
                {
                    display: "flex",
                    alignItems: resolveFlexAlign(align),
                    justifyContent: resolveFlexJustify(justify),
                    flexDirection: direction,
                    flexWrap: wrap,
                },
                { ...spacing, style },
            )}
        >
            {children}
        </Component>
    );
}

export function Text({
    as = "span",
    className,
    style,
    children,
    size,
    weight,
    color,
    align,
    ...spacing
}: CommonLayoutProps &
    React.HTMLAttributes<HTMLElement> & {
        size?: SizeToken;
        weight?: WeightToken;
        color?: ColorToken;
        align?: React.CSSProperties["textAlign"];
    }) {
    const Component = as as React.ElementType;
    return (
        <Component
            className={["tui-text", className].filter(Boolean).join(" ")}
            style={mergeStyles(
                {
                    fontSize: resolveFontSize(size),
                    fontWeight: resolveWeight(weight),
                    color: resolveColor(color),
                    textAlign: align,
                },
                { ...spacing, style },
            )}
        >
            {children}
        </Component>
    );
}

export function Heading({
    as = "h2",
    className,
    style,
    children,
    size,
    color,
    ...spacing
}: CommonLayoutProps &
    React.HTMLAttributes<HTMLElement> & {
        size?: SizeToken;
        color?: ColorToken;
    }) {
    const Component = as as React.ElementType;
    return (
        <Component
            className={["tui-heading", className].filter(Boolean).join(" ")}
            style={mergeStyles(
                {
                    fontSize: resolveFontSize(size ?? "4"),
                    color: resolveColor(color),
                },
                { ...spacing, style },
            )}
        >
            {children}
        </Component>
    );
}

export const TahoeButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: VariantToken;
        color?: ColorToken;
        size?: SizeToken;
    }
>(function TahoeButton({ className, variant = "solid", color, size = "2", type = "button", ...props }, ref) {
    return (
        <button
            ref={ref}
            type={type}
            className={[
                "tui-button",
                `tui-button--${variant}`,
                `tui-button--size-${String(size)}`,
                color ? `tui-button--color-${color}` : "",
                className,
            ].filter(Boolean).join(" ")}
            {...props}
        />
    );
});

export const Button = TahoeButton;

export function TahoeBadge({
    className,
    variant = "soft",
    color,
    radius,
    size = "2",
    children,
    style,
    as,
    m,
    mt,
    mb,
    ml,
    mr,
    mx,
    my,
    p,
    pt,
    pb,
    pl,
    pr,
    px,
    py,
    gap,
    rowGap,
    columnGap,
    ...rest
}: CommonLayoutProps &
    React.HTMLAttributes<HTMLSpanElement> & {
    variant?: VariantToken;
    color?: ColorToken;
    radius?: "full" | string;
    size?: SizeToken;
}) {
    const Component = (as as React.ElementType) || "span";
    return (
        <Component
            className={[
                "tui-badge",
                `tui-badge--${variant}`,
                `tui-badge--size-${String(size)}`,
                color ? `tui-badge--color-${color}` : "",
                radius === "full" ? "tui-badge--full" : "",
                className,
            ].filter(Boolean).join(" ")}
            style={mergeStyles(
                radius && radius !== "full" ? { borderRadius: radius } : {},
                { m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py, gap, rowGap, columnGap, style },
            )}
            {...rest}
        >
            {children}
        </Component>
    );
}

export const Badge = TahoeBadge;

export function TahoeCard({
    className,
    children,
    style,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={["tui-card", className].filter(Boolean).join(" ")} style={style} {...props}>
            {children}
        </div>
    );
}

export const Card = TahoeCard;

export function Separator({
    className,
    style,
    size: _size,
    ...spacing
}: CommonLayoutProps & React.HTMLAttributes<HTMLHRElement> & { size?: SizeToken }) {
    return <div role="separator" className={["tui-separator", className].filter(Boolean).join(" ")} style={mergeStyles({}, { ...spacing, style })} />;
}

export function TahoeSpinner({ className, size = "2" }: { className?: string; size?: SizeToken }) {
    return <span className={["tui-spinner", `tui-spinner--size-${String(size)}`, className].filter(Boolean).join(" ")} aria-hidden="true" />;
}

export const Spinner = TahoeSpinner;

const CalloutContext = React.createContext<{ color?: ColorToken }>({});

function CalloutRoot({
    className,
    color,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { color?: ColorToken }) {
    return (
        <CalloutContext.Provider value={{ color }}>
            <div className={["tui-callout", color ? `tui-callout--${color}` : "", className].filter(Boolean).join(" ")} {...props}>
                {children}
            </div>
        </CalloutContext.Provider>
    );
}

function CalloutIcon({ className, children }: React.HTMLAttributes<HTMLSpanElement>) {
    const { color } = React.useContext(CalloutContext);
    return <span className={["tui-callout__icon", color ? `tui-callout__icon--${color}` : "", className].filter(Boolean).join(" ")}>{children}</span>;
}

function CalloutText({ className, children }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={["tui-callout__text", className].filter(Boolean).join(" ")}>{children}</span>;
}

export const TahoeNotice = {
    Root: CalloutRoot,
    Icon: CalloutIcon,
    Text: CalloutText,
};

export const Callout = TahoeNotice;

type SlotMarkerProps = { children?: React.ReactNode };

function TextFieldSlot({ children }: SlotMarkerProps) {
    return <>{children}</>;
}
TextFieldSlot.displayName = "TahoeTextFieldSlot";

export const TahoeInput = React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
        size?: SizeToken;
        slotClassName?: string;
        rootClassName?: string;
        children?: React.ReactNode;
    }
>(function TahoeInput({ className, rootClassName, slotClassName, children, size = "2", style, ...props }, ref) {
    const childArray = React.Children.toArray(children);
    const slots = childArray.filter(
        (child): child is React.ReactElement<{ children?: React.ReactNode }> =>
            React.isValidElement(child) &&
            ((child.type as { displayName?: string }).displayName === "TahoeTextFieldSlot"),
    );
    return (
        <label className={["tui-textfield", `tui-textfield--size-${String(size)}`, rootClassName].filter(Boolean).join(" ")} style={style}>
            {slots.map((slot, index) => (
                <span key={index} className={["tui-textfield__slot", slotClassName].filter(Boolean).join(" ")}>
                    {slot.props.children}
                </span>
            ))}
            <input ref={ref} className={["tui-textfield__input", className].filter(Boolean).join(" ")} {...props} />
        </label>
    );
});

export const TextField = {
    Root: TahoeInput,
    Slot: TextFieldSlot,
};

export const Checkbox = React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
        onCheckedChange?: (checked: boolean) => void;
        size?: SizeToken;
    }
>(function Checkbox({ className, onCheckedChange, onChange, checked, size: _size, ...props }, ref) {
    return (
        <input
            ref={ref}
            type="checkbox"
            className={["tui-checkbox", className].filter(Boolean).join(" ")}
            checked={Boolean(checked)}
            onChange={(event) => {
                onChange?.(event);
                onCheckedChange?.(event.target.checked);
            }}
            {...props}
        />
    );
});

export const Switch = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
        size?: SizeToken;
    }
>(function Switch({ className, checked = false, onCheckedChange, onClick, type = "button", size: _size, ...props }, ref) {
    return (
        <button
            ref={ref}
            type={type}
            role="switch"
            aria-checked={checked}
            className={["tui-switch", checked ? "tui-switch--checked" : "", className].filter(Boolean).join(" ")}
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    onCheckedChange?.(!checked);
                }
            }}
            {...props}
        >
            <span className="tui-switch__thumb" />
        </button>
    );
});

function TableRoot({
    className,
    children,
    ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { variant?: string }) {
    return (
        <div className="tui-table-shell">
            <table className={["tui-table", className].filter(Boolean).join(" ")} {...props}>
                {children}
            </table>
        </div>
    );
}

function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead {...props} />;
}

function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />;
}

function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr {...props} />;
}

function TableColumnHeaderCell(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={["tui-table__header-cell", props.className].filter(Boolean).join(" ")} {...props} />;
}

function TableRowHeaderCell(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={["tui-table__row-header-cell", props.className].filter(Boolean).join(" ")} {...props} />;
}

function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={["tui-table__cell", props.className].filter(Boolean).join(" ")} {...props} />;
}

export const Table = {
    Root: TableRoot,
    Header: TableHeader,
    Body: TableBody,
    Row: TableRow,
    ColumnHeaderCell: TableColumnHeaderCell,
    RowHeaderCell: TableRowHeaderCell,
    Cell: TableCell,
};

type DialogContextValue = {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error("Dialog components must be used within Dialog.Root");
    }
    return context;
}

function getTabbables(container: HTMLElement) {
    return Array.from(
        container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
    ).filter((element) => !element.hasAttribute("hidden") && element.tabIndex !== -1);
}

function TahoeModalRoot({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}) {
    return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

function TahoeModalContent({
    children,
    className,
    maxWidth,
    style,
    "aria-label": ariaLabel,
}: {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
    style?: React.CSSProperties;
    "aria-label"?: string;
}) {
    const { open, onOpenChange } = useDialogContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open || typeof document === "undefined") return;
        const previousOverflow = document.body.style.overflow;
        const previousActive = document.activeElement as HTMLElement | null;
        document.body.style.overflow = "hidden";
        window.setTimeout(() => {
            const container = contentRef.current;
            if (!container) return;
            const tabbables = getTabbables(container);
            (tabbables[0] ?? container).focus();
        }, 0);
        return () => {
            document.body.style.overflow = previousOverflow;
            previousActive?.focus?.();
        };
    }, [open]);

    React.useEffect(() => {
        if (!open || typeof document === "undefined") return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onOpenChange?.(false);
                return;
            }
            if (event.key !== "Tab") return;
            const container = contentRef.current;
            if (!container) return;
            const tabbables = getTabbables(container);
            if (tabbables.length === 0) {
                event.preventDefault();
                container.focus();
                return;
            }
            const first = tabbables[0];
            const last = tabbables[tabbables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [open, onOpenChange]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="tui-dialog-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange?.(false);
                }
            }}
        >
            <div
                ref={contentRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                className={["tui-dialog-content", className].filter(Boolean).join(" ")}
                style={maxWidth ? { ...style, maxWidth, width: style?.width ?? "100%" } : style}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

function TahoeModalTitle({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={["tui-dialog-title", className].filter(Boolean).join(" ")}>{children}</h2>;
}

function TahoeModalDescription({
    children,
    className,
    style,
    size,
    ...spacing
}: React.HTMLAttributes<HTMLParagraphElement> & CommonLayoutProps & { size?: SizeToken }) {
    return (
        <p
            className={["tui-dialog-description", className].filter(Boolean).join(" ")}
            style={mergeStyles({ fontSize: resolveFontSize(size) ?? "14px" }, { ...spacing, style })}
        >
            {children}
        </p>
    );
}

function TahoeModalClose({
    asChild: _asChild,
    children,
}: {
    asChild?: boolean;
    children: React.ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }>;
}) {
    const { onOpenChange } = useDialogContext();
    return React.cloneElement(children, {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
            children.props.onClick?.(event);
            if (!event.defaultPrevented) {
                onOpenChange?.(false);
            }
        },
    });
}

export const TahoeModal = {
    Root: TahoeModalRoot,
    Content: TahoeModalContent,
    Title: TahoeModalTitle,
    Description: TahoeModalDescription,
    Close: TahoeModalClose,
};

export const Dialog = TahoeModal;

export const TahoeSelect = React.forwardRef<
    HTMLSelectElement,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
        size?: SizeToken;
    }
>(function TahoeSelect({ className, children, size = "2", ...props }, ref) {
    return (
        <select
            ref={ref}
            className={["tahoe-select", `tahoe-select--size-${String(size)}`, className].filter(Boolean).join(" ")}
            {...props}
        >
            {children}
        </select>
    );
});
