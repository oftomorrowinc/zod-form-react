import * as React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

export interface ArrayItem {
  id: string;
  [key: string]: unknown;
}

export interface ArrayFieldProps {
  name: string;
  label?: string;
  description?: string;
  items: ArrayItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  renderItem: (item: ArrayItem, index: number) => React.ReactNode;
  addButtonText?: string;
  removeButtonText?: string;
  minItems?: number;
  maxItems?: number;
  sortable?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ArrayField = React.forwardRef<HTMLDivElement, ArrayFieldProps>(
  (
    {
      name,
      label,
      description,
      items,
      onAdd,
      onRemove,
      onMove,
      renderItem,
      addButtonText = 'Add item',
      removeButtonText = 'Remove',
      minItems = 0,
      maxItems,
      sortable = false,
      disabled,
      className,
    },
    ref,
  ) => {
    const canAdd = !maxItems || items.length < maxItems;
    const canRemove = items.length > minItems;

    const onDragStart = (e: React.DragEvent, index: number) => {
      if (!sortable || disabled) return;
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (e: React.DragEvent) => {
      if (!sortable || disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };
    const onDrop = (e: React.DragEvent, dropIndex: number) => {
      if (!sortable || disabled || !onMove) return;
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!Number.isNaN(dragIndex) && dragIndex !== dropIndex) {
        onMove(dragIndex, dropIndex);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('space-y-3 rounded-md border bg-card p-4', className)}
        data-field={name}
      >
        {(label || description) && (
          <div className="space-y-1">
            {label && <div className="text-sm font-medium">{label}</div>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            No items yet
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="rounded-md border bg-background p-3"
                draggable={sortable && !disabled}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, index)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {sortable && !disabled && (
                      <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                    <span>Item {index + 1}</span>
                  </div>
                  {canRemove && !disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(index)}
                      aria-label={removeButtonText}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
                {renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}

        {canAdd && !disabled && (
          <Button type="button" variant="outline" onClick={onAdd} className="w-full">
            <Plus className="h-4 w-4" aria-hidden /> {addButtonText}
          </Button>
        )}

        {items.length < minItems && (
          <p className="text-sm text-destructive">
            At least {minItems} item{minItems === 1 ? '' : 's'} required
          </p>
        )}
      </div>
    );
  },
);
ArrayField.displayName = 'ArrayField';
