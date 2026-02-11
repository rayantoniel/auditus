import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string | number | null;
  onSave: (value: string | number | null) => Promise<void>;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
  className?: string;
  disabled?: boolean;
}

export function EditableCell({
  value,
  onSave,
  type = "text",
  options = [],
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
      setEditValue(originalValue);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, type, onSave, isSaving]);

  const handleSelectSave = useCallback(async (newVal: string) => {
    if (isSaving) return;
    const saveValue = newVal === "__clear__" ? null : newVal;
    setIsSaving(true);
    try {
      await onSave(saveValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value?.toString() ?? "");
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave, isSaving]);

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

  if (type === "select" && isEditing) {
    return (
      <Select
        value={value?.toString() ?? ""}
        onValueChange={(val) => {
          handleSelectSave(val);
        }}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
        defaultOpen
      >
        <SelectTrigger className="h-8 text-sm w-full">
          <SelectValue placeholder="Selecionar..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">
            <span className="text-muted-foreground italic">Limpar</span>
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
