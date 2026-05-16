import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArrayField } from './ArrayField';
import { ObjectField } from './ObjectField';

void fireEvent;

describe('ArrayField', () => {
  it('renders empty-state message when no items', () => {
    render(
      <ArrayField
        name="tags"
        label="Tags"
        items={[]}
        onAdd={() => {}}
        onRemove={() => {}}
        renderItem={() => null}
      />,
    );
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it('calls onAdd when add button clicked', async () => {
    const onAdd = vi.fn();
    render(
      <ArrayField
        name="tags"
        label="Tags"
        items={[]}
        onAdd={onAdd}
        onRemove={() => {}}
        renderItem={() => null}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders each item and supports remove', async () => {
    const onRemove = vi.fn();
    render(
      <ArrayField
        name="tags"
        label="Tags"
        items={[
          { id: '0', value: 'first' },
          { id: '1', value: 'second' },
        ]}
        onAdd={() => {}}
        onRemove={onRemove}
        renderItem={(item) => <span>{String(item.value)}</span>}
      />,
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    const removeButtons = screen.getAllByLabelText('Remove');
    const first = removeButtons[0];
    if (!first) throw new Error('expected a remove button');
    await userEvent.click(first);
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('hides remove buttons when at minItems', () => {
    render(
      <ArrayField
        name="tags"
        items={[{ id: '0' }]}
        onAdd={() => {}}
        onRemove={() => {}}
        renderItem={() => null}
        minItems={1}
      />,
    );
    expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument();
  });

  it('hides add button when at maxItems', () => {
    render(
      <ArrayField
        name="tags"
        items={[{ id: '0' }, { id: '1' }]}
        onAdd={() => {}}
        onRemove={() => {}}
        renderItem={() => null}
        maxItems={2}
      />,
    );
    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  });
});

describe('ObjectField', () => {
  it('renders children inside a panel', () => {
    render(
      <ObjectField name="profile" label="Profile">
        <span>inner</span>
      </ObjectField>,
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('inner')).toBeInTheDocument();
  });

  it('collapses when toggled', async () => {
    render(
      <ObjectField name="profile" label="Profile" collapsible defaultExpanded>
        <span>inner</span>
      </ObjectField>,
    );
    expect(screen.getByText('inner')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /collapse/i }));
    expect(screen.queryByText('inner')).not.toBeInTheDocument();
  });
});

describe('ArrayField drag-and-drop (sortable)', () => {
  it('fires onMove when an item is dropped on another index', () => {
    const onMove = vi.fn();
    render(
      <ArrayField
        name="tags"
        items={[
          { id: '0', value: 'a' },
          { id: '1', value: 'b' },
        ]}
        onAdd={() => {}}
        onRemove={() => {}}
        onMove={onMove}
        renderItem={(item) => <span>{String(item.value)}</span>}
        sortable
      />,
    );
    const items = document.querySelectorAll('li[draggable=true]');
    const first = items[0] as HTMLElement;
    const second = items[1] as HTMLElement;
    const dataMap: Record<string, string> = {};
    const dt = {
      setData: (k: string, v: string) => {
        dataMap[k] = v;
      },
      getData: (k: string) => dataMap[k] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };
    // Simulate dragstart on item 0
    first.dispatchEvent(
      Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }),
    );
    second.dispatchEvent(
      Object.assign(new Event('dragover', { bubbles: true, cancelable: true }), {
        dataTransfer: dt,
      }),
    );
    second.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), { dataTransfer: dt }),
    );
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });
});
