import * as React from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FileUploadProps {
  name?: string;
  value?: File | File[] | null;
  onChange?: (files: File | File[] | null) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const toArray = (v: File | File[] | null | undefined): File[] => {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
};

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      name,
      value,
      onChange,
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      disabled,
      className,
      ...ariaProps
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const files = toArray(value);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const cap = maxFiles ?? (multiple ? Infinity : 1);

    const accept_files = (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      const accepted: File[] = [];
      for (const f of list) {
        if (maxSize && f.size > maxSize) {
          setErrorMsg(`"${f.name}" exceeds ${formatBytes(maxSize)}`);
          continue;
        }
        accepted.push(f);
        if (accepted.length >= cap) break;
      }
      if (!accepted.length) return;
      setErrorMsg(null);
      onChange?.(multiple ? accepted : (accepted[0] ?? null));
    };

    const remove = (idx: number) => {
      const next = files.filter((_, i) => i !== idx);
      onChange?.(multiple ? next : (next[0] ?? null));
    };

    return (
      <div className={cn('space-y-2', className)}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background p-6 text-sm text-muted-foreground transition-colors',
            dragOver && 'border-ring bg-accent/50',
            disabled && 'cursor-not-allowed opacity-50',
            !disabled && 'cursor-pointer hover:bg-accent/50',
          )}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled) accept_files(e.dataTransfer.files);
          }}
        >
          <Upload className="h-5 w-5" aria-hidden />
          <span>
            <span className="font-medium text-foreground">Click to upload</span> or drag and drop
          </span>
          {accept && <span className="text-xs">Accepts: {accept}</span>}
          {maxSize && <span className="text-xs">Max size: {formatBytes(maxSize)}</span>}
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) accept_files(e.target.files);
            }}
            {...ariaProps}
          />
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {f.name} <span className="text-muted-foreground">({formatBytes(f.size)})</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove(i)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
FileUpload.displayName = 'FileUpload';

export { FileUpload };
