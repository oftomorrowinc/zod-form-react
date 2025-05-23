import React from 'react';
import { ArrayFieldProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';
import { Button } from '../ui/Button';

export const ArrayField = React.forwardRef<HTMLDivElement, ArrayFieldProps>(
  (
    {
      className,
      name,
      label,
      description,
      error,
      items,
      onAdd,
      onRemove,
      onMove,
      renderItem,
      addButtonText = 'Add Item',
      removeButtonText = 'Remove',
      minItems = 0,
      maxItems,
      sortable = false,
      collapsible = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const canAdd = !maxItems || items.length < maxItems;
    const canRemove = items.length > minItems;
    const hasError = !!error;

    const handleDragStart = (e: React.DragEvent, index: number) => {
      if (!sortable || disabled) return;
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      if (!sortable || disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      if (!sortable || disabled) return;
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (dragIndex !== dropIndex && onMove) {
        onMove(dragIndex, dropIndex);
      }
    };

    const containerClasses = cn(
      themeClasses.array.container,
      hasError && 'border-zf-error',
      className
    );

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {/* Array Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {label && <h3 className="text-sm font-medium text-zf-text">{label}</h3>}
            {description && <p className="text-xs text-zf-text-muted mt-1">{description}</p>}
          </div>
          <div className="flex items-center space-x-2 text-xs text-zf-text-muted">
            <span>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            {minItems > 0 && <span>• Min: {minItems}</span>}
            {maxItems && <span>• Max: {maxItems}</span>}
          </div>
        </div>

        {/* Array Items */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-zf-text-muted">
              <svg
                className="mx-auto h-8 w-8 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-sm">No items yet</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  themeClasses.array.item,
                  sortable && !disabled && 'cursor-move',
                  hasError && 'border-zf-error/50'
                )}
                draggable={sortable && !disabled}
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
              >
                {/* Item Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {sortable && !disabled && (
                      <svg
                        className="h-4 w-4 text-zf-text-muted cursor-grab active:cursor-grabbing"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-zf-text">Item {index + 1}</span>
                  </div>

                  {canRemove && !disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(index)}
                      className="text-zf-error hover:text-zf-error/80 hover:bg-zf-error/10"
                      title={removeButtonText}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  )}
                </div>

                {/* Item Content */}
                <div className="pl-6 border-l-2 border-zf-border/30">{renderItem(item, index)}</div>
              </div>
            ))
          )}
        </div>

        {/* Add Button */}
        {canAdd && !disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={onAdd}
            className={themeClasses.array.addButton}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
          >
            {addButtonText}
          </Button>
        )}

        {/* Validation Messages */}
        <div className="mt-2 space-y-1">
          {!canAdd && maxItems && (
            <p className="text-xs text-zf-text-muted">Maximum {maxItems} items allowed</p>
          )}
          {items.length < minItems && (
            <p className="text-xs text-zf-error">
              At least {minItems} item{minItems !== 1 ? 's' : ''} required
            </p>
          )}
        </div>
      </div>
    );
  }
);

ArrayField.displayName = 'ArrayField';
