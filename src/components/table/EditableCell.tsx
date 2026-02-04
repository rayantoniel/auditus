import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string | number | null;
  onSave: (value: string | number | null) => Promise<void>;
  type?: "text" | "number" | "date";
  className?: string;
  disabled?: boolean;
}

export function EditableCell({
  value,
  onSave,
  type = "text",
  className,
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(value?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value?.toString() ?? "");
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const trimmedValue = editValue.trim();
    const originalValue = value?.toString() ?? "";

    // No change
    if (trimmedValue === originalValue) {
      setIsEditing(false);
      return;
    }

    let newValue: string | number | null = trimmedValue || null;

    if (type === "number" && trimmedValue) {
      const numValue = parseInt(trimmedValue, 10);
      newValue = isNaN(numValue) ? null : numValue;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      // Revert to original
      setEditValue(originalValue);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, type, onSave, isSaving]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value?.toString() ?? "");
      setIsEditing(false);
    }
  };

  const formatDisplayValue = () => {
    if (value === null || value === undefined || value === "") return "-";

    if (type === "date" && typeof value === "string") {
      // Format YYYY-MM-DD to DD/MM/YYYY
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }

    return value.toString();
  };

  if (disabled) {
    return (
      <span className={cn("block truncate", className)}>
        {formatDisplayValue()}
      </span>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type === "date" ? "date" : type === "number" ? "number" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={cn(
          "h-8 px-2 py-1 text-sm",
          type === "date" && "w-36",
          className
        )}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "block truncate cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded -mx-1 transition-colors",
        className
      )}
      title="Clique para editar"
    >
      {formatDisplayValue()}
    </span>
  );
}
