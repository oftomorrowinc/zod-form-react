import React, { useState, useRef, useEffect } from 'react';
import { SelectProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error,
      options,
      emptyOption,
      searchable = false,
      creatable = false,
      onCreateOption,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const selectRef = useRef<HTMLSelectElement>(null);
    const hasError = !!error;

    // Group options by group property
    const groupedOptions = options.reduce(
      (acc, option) => {
        const group = option.group || 'default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, typeof options>
    );

    const hasGroups = Object.keys(groupedOptions).length > 1 || options.some(opt => opt.group);

    // Filter options based on search
    useEffect(() => {
      if (!searchValue.trim()) {
        setFilteredOptions(options);
        return;
      }

      const filtered = options.filter(
        option =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          String(option.value).toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }, [searchValue, options]);

    const selectClasses = cn(
      themeClasses.select.base,
      hasError && themeClasses.select.error,
      disabled && themeClasses.input.disabled,
      className
    );

    // Simple select for non-searchable
    if (!searchable && !creatable) {
      return (
        <select ref={ref} className={selectClasses} disabled={disabled} {...props}>
          {emptyOption && <option value="">{emptyOption}</option>}

          {hasGroups
            ? Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <optgroup key={group} label={group !== 'default' ? group : undefined}>
                  {groupOptions.map(option => (
                    <option
                      key={String(option.value)}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options.map(option => (
                <option key={String(option.value)} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
        </select>
      );
    }

    // Enhanced select with search and create functionality
    return (
      <div className="relative">
        <select
          ref={element => {
            if (selectRef.current !== element) {
              (selectRef as React.MutableRefObject<HTMLSelectElement | null>).current = element;
            }
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref && 'current' in ref) {
              (ref as any).current = element;
            }
          }}
          className={cn(selectClasses, 'sr-only')}
          disabled={disabled}
          {...props}
        >
          {emptyOption && <option value="">{emptyOption}</option>}
          {options.map(option => (
            <option key={String(option.value)} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          className={cn(selectClasses, 'cursor-pointer', isOpen && 'ring-2 ring-zf-primary')}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">
              {props.value
                ? options.find(opt => opt.value === props.value)?.label || String(props.value)
                : emptyOption || 'Select an option...'}
            </span>
            <svg
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-zf-surface border border-zf-border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b border-zf-border">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  className={cn(themeClasses.input.base, 'w-full')}
                  autoFocus
                />
              </div>
            )}

            <div className="py-1">
              {emptyOption && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zf-surface/50 focus:bg-zf-surface/50 focus:outline-none"
                  onClick={() => {
                    props.onChange?.({ target: { value: '' } } as any);
                    setIsOpen(false);
                    setSearchValue('');
                  }}
                >
                  {emptyOption}
                </button>
              )}

              {filteredOptions.length === 0 && searchValue && creatable && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-zf-primary hover:bg-zf-surface/50 focus:bg-zf-surface/50 focus:outline-none"
                  onClick={() => {
                    onCreateOption?.(searchValue);
                    setIsOpen(false);
                    setSearchValue('');
                  }}
                >
                  Create "{searchValue}"
                </button>
              )}

              {filteredOptions.map(option => (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={option.disabled}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-zf-surface/50 focus:bg-zf-surface/50 focus:outline-none',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    props.value === option.value && 'bg-zf-primary text-white'
                  )}
                  onClick={() => {
                    if (!option.disabled) {
                      props.onChange?.({ target: { value: option.value } } as any);
                      setIsOpen(false);
                      setSearchValue('');
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />}
      </div>
    );
  }
);

Select.displayName = 'Select';
