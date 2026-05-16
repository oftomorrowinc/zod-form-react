import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { ZodForm } from './ZodForm';

describe('ZodForm — per-field rendering', () => {
  it('renders one input per top-level field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      bio: z.string().min(100),
    });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('bio')).toBeInTheDocument();
    // bio is min(100) → textarea
    expect(document.querySelector('textarea')).toBeTruthy();
  });

  it('renders an email input when schema declares .email()', () => {
    const schema = z.object({ email: z.string().email() });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(document.querySelector('input[type=email]')).toBeTruthy();
  });

  it('renders a checkbox for boolean schema', async () => {
    const schema = z.object({ subscribe: z.boolean() });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders radio options for small enums', () => {
    const schema = z.object({ role: z.enum(['admin', 'user']) });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('renders a select for larger enums', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest', 'manager', 'owner']),
    });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders a range slider for small numeric ranges', () => {
    const schema = z.object({ rating: z.number().min(1).max(5) });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(document.querySelector('input[type=range]')).toBeTruthy();
  });

  it('respects fieldOptions to override the inferred type (e.g. stars)', () => {
    const schema = z.object({ rating: z.number().min(1).max(5) });
    render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        fieldOptions={{ rating: { type: 'stars', maxStars: 5 } }}
      />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('marks required fields with an asterisk', () => {
    const schema = z.object({ name: z.string(), nick: z.string().optional() });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    // Both labels render. Required name should have a trailing asterisk.
    expect(screen.getByText('name').textContent).toContain('*');
    expect(screen.getByText('nick').textContent).not.toContain('*');
  });

  it('renders a switch when fieldOptions overrides boolean → switch', () => {
    const schema = z.object({ notifications: z.boolean() });
    render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        fieldOptions={{ notifications: { type: 'switch' } }}
      />,
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders a file upload when fieldOptions overrides → file', () => {
    const schema = z.object({ doc: z.string() });
    render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        fieldOptions={{ doc: { type: 'file', accept: 'image/*' } }}
      />,
    );
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
  });

  it('renders a date input for z.date()', () => {
    const schema = z.object({ when: z.date() });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(document.querySelector('input[type=date]')).toBeTruthy();
  });

  it('renders datetime-local and time when overridden via fieldOptions', () => {
    const schema = z.object({ dt: z.date(), tm: z.date() });
    const { container } = render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        fieldOptions={{ dt: { type: 'datetime-local' }, tm: { type: 'time' } }}
      />,
    );
    expect(container.querySelector('input[type=datetime-local]')).toBeTruthy();
    expect(container.querySelector('input[type=time]')).toBeTruthy();
  });

  it('renders password and tel inputs when overridden via fieldOptions', () => {
    const schema = z.object({ pw: z.string(), phone: z.string() });
    const { container } = render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        fieldOptions={{ pw: { type: 'password' }, phone: { type: 'tel' } }}
      />,
    );
    expect(container.querySelector('input[type=password]')).toBeTruthy();
    expect(container.querySelector('input[type=tel]')).toBeTruthy();
  });

  it('renders nested object fields via ObjectField adapter', () => {
    const schema = z.object({
      profile: z.object({ bio: z.string() }),
    });
    render(<ZodForm schema={schema} onSubmit={() => {}} />);
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('bio')).toBeInTheDocument();
  });
});

describe('ZodForm — submit & validation integration', () => {
  it('fires onSubmit with parsed values for a valid multi-field schema', async () => {
    const onSubmit = vi.fn();
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      subscribe: z.boolean(),
      role: z.enum(['admin', 'user']),
      rating: z.number().min(1).max(5),
      profile: z.object({
        bio: z.string(),
      }),
      tags: z.array(z.string()),
    });

    const { container } = render(
      <ZodForm
        schema={schema}
        onSubmit={onSubmit}
        defaultValues={{
          name: '',
          email: '',
          subscribe: false,
          role: 'user',
          rating: 3,
          profile: { bio: '' },
          tags: [],
        }}
      />,
    );

    await userEvent.type(container.querySelector('input[type=text]') as HTMLInputElement, 'Alice');
    await userEvent.type(
      container.querySelector('input[type=email]') as HTMLInputElement,
      'alice@example.com',
    );
    await userEvent.click(screen.getByRole('checkbox'));

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const call = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.name).toBe('Alice');
    expect(call.email).toBe('alice@example.com');
    expect(call.subscribe).toBe(true);
    expect(call.role).toBe('user');
    expect(call.rating).toBe(3);
  });

  it('blocks submit and surfaces validation errors when fields are invalid', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const schema = z.object({
      name: z.string().min(3, 'Name too short'),
      email: z.string().email('Invalid email'),
    });

    const { container } = render(
      <ZodForm
        schema={schema}
        onSubmit={onSubmit}
        onError={onError}
        defaultValues={{ name: '', email: '' }}
      />,
    );

    const nameInput = container.querySelector('input[type=text]') as HTMLInputElement;
    const emailInput = container.querySelector('input[type=email]') as HTMLInputElement;
    await userEvent.type(nameInput, 'ab');
    await userEvent.type(emailInput, 'bad');

    // fireEvent.submit dispatches the SubmitEvent directly on the <form>,
    // bypassing any button-state masking and React's button-click batching.
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(
      () => {
        expect(onError).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fires onChange whenever the form values mutate', async () => {
    const onChange = vi.fn();
    const schema = z.object({ name: z.string() });
    render(<ZodForm schema={schema} onSubmit={() => {}} onChange={onChange} />);
    await userEvent.type(document.querySelector('input[type=text]') as HTMLInputElement, 'x');
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(last.name).toBe('x');
  });

  it('resets the form via the reset button', async () => {
    const schema = z.object({ name: z.string() });
    render(
      <ZodForm
        schema={schema}
        onSubmit={() => {}}
        showResetButton
        defaultValues={{ name: 'init' }}
      />,
    );
    const input = document.querySelector('input[type=text]') as HTMLInputElement;
    expect(input.value).toBe('init');
    await userEvent.clear(input);
    await userEvent.type(input, 'new');
    expect(input.value).toBe('new');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    await waitFor(() => expect(input.value).toBe('init'));
  });

  it('supports adding items to an array field through the array adapter', async () => {
    const schema = z.object({ tags: z.array(z.string()) });
    render(<ZodForm schema={schema} onSubmit={() => {}} defaultValues={{ tags: [] }} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
