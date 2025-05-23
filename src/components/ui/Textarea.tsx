import React, { useRef, useEffect, useCallback } from 'react';
import { TextareaProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      autoResize = false,
      maxRows = 10,
      documentUpload = false,
      onDocumentUpload,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasError = !!error;

    // Auto-resize functionality
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
      const maxHeight = lineHeight * maxRows;

      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }, [autoResize, maxRows]);

    useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    // Document upload functionality
    const handleDocumentUpload = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !onDocumentUpload) return;

        const reader = new FileReader();
        reader.onload = e => {
          const text = e.target?.result as string;
          onDocumentUpload(text);
        };
        reader.readAsText(file);
      },
      [onDocumentUpload]
    );

    const triggerFileUpload = () => {
      if (fileInputRef.current && !disabled && !readOnly) {
        fileInputRef.current.click();
      }
    };

    const textareaClasses = cn(
      themeClasses.textarea.base,
      hasError && themeClasses.textarea.error,
      disabled && themeClasses.input.disabled,
      readOnly && themeClasses.input.readOnly,
      autoResize && 'resize-none',
      documentUpload && 'pr-10',
      className
    );

    return (
      <div className="relative">
        <textarea
          ref={element => {
            textareaRef.current = element || undefined;
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
          }}
          className={textareaClasses}
          disabled={disabled}
          readOnly={readOnly}
          onChange={e => {
            props.onChange?.(e);
            adjustHeight();
          }}
          {...props}
        />

        {documentUpload && (
          <>
            <button
              type="button"
              onClick={triggerFileUpload}
              disabled={disabled || readOnly}
              className="absolute top-3 right-3 p-1 text-zf-text-muted hover:text-zf-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload document to extract text"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
