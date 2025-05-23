import React, { useRef, useState, useCallback } from 'react';
import { FileUploadProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

interface FilePreview {
  file: File;
  url?: string;
  error?: string;
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      name,
      accept,
      multiple = false,
      maxSize = 5 * 1024 * 1024, // 5MB default
      maxFiles = multiple ? 10 : 1,
      imagePreview = false,
      documentUpload = false,
      value,
      onChange,
      onError,
      disabled,
      error,
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [previews, setPreviews] = useState<FilePreview[]>([]);
    const hasError = !!error;

    const processFiles = useCallback(
      (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const files = Array.from(fileList);
        const validFiles: File[] = [];
        const newPreviews: FilePreview[] = [];

        files.forEach(file => {
          // Validate file size
          if (maxSize && file.size > maxSize) {
            onError?.(
              `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
            );
            return;
          }

          // Validate file count
          if (validFiles.length >= maxFiles) {
            onError?.(multiple ? `Maximum ${maxFiles} files allowed` : 'Only one file allowed');
            return;
          }

          validFiles.push(file);

          // Create preview for images
          if (imagePreview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
              const preview: FilePreview = {
                file,
                url: e.target?.result as string,
              };
              newPreviews.push(preview);
              setPreviews(prev => [...prev.filter(p => p.file.name !== file.name), preview]);
            };
            reader.onerror = () => {
              const preview: FilePreview = {
                file,
                error: 'Failed to load preview',
              };
              newPreviews.push(preview);
              setPreviews(prev => [...prev.filter(p => p.file.name !== file.name), preview]);
            };
            reader.readAsDataURL(file);
          } else {
            const preview: FilePreview = { file };
            newPreviews.push(preview);
            setPreviews(prev => [...prev.filter(p => p.file.name !== file.name), preview]);
          }
        });

        if (validFiles.length > 0) {
          onChange?.(multiple ? validFiles : (validFiles as File[]));
        }
      },
      [maxSize, maxFiles, multiple, imagePreview, onChange, onError]
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          setIsDragOver(true);
        }
      },
      [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!disabled) {
          processFiles(e.dataTransfer.files);
        }
      },
      [disabled, processFiles]
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
      },
      [processFiles]
    );

    const handleClick = useCallback(() => {
      if (!disabled && inputRef.current) {
        inputRef.current.click();
      }
    }, [disabled]);

    const removeFile = useCallback(
      (fileToRemove: File) => {
        setPreviews(prev => prev.filter(p => p.file !== fileToRemove));

        if (multiple && Array.isArray(value)) {
          const newFiles = value.filter(f => f !== fileToRemove);
          onChange?.(newFiles.length > 0 ? newFiles : null);
        } else {
          onChange?.(null);
        }
      },
      [multiple, value, onChange]
    );

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const containerClasses = cn(
      themeClasses.fileUpload.container,
      isDragOver && themeClasses.fileUpload.active,
      hasError && 'border-zf-error',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    return (
      <div className="space-y-4">
        <div
          className={containerClasses}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={element => {
              if (inputRef.current !== element) {
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
              }
              if (typeof ref === 'function') {
                ref(element);
              } else if (ref && 'current' in ref) {
                (ref as any).current = element;
              }
            }}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            {...props}
          />

          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-zf-text-muted"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <p className="text-sm text-zf-text">
                <span className="font-medium text-zf-primary hover:text-zf-primary/80 cursor-pointer">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-zf-text-muted mt-1">
                {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
              </p>
              {maxSize && (
                <p className="text-xs text-zf-text-muted">
                  Maximum size: {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              )}
              {multiple && <p className="text-xs text-zf-text-muted">Maximum {maxFiles} files</p>}
            </div>
          </div>
        </div>

        {/* File Previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            {previews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-zf-surface border border-zf-border rounded-md"
              >
                <div className="flex items-center space-x-3">
                  {preview.url ? (
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-zf-border rounded flex items-center justify-center">
                      <svg className="h-5 w-5 text-zf-text" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zf-text truncate max-w-xs">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-zf-text-muted">
                      {formatFileSize(preview.file.size)}
                    </p>
                    {preview.error && <p className="text-xs text-zf-error">{preview.error}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(preview.file)}
                  className="text-zf-error hover:text-zf-error/80 p-1"
                  title="Remove file"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
