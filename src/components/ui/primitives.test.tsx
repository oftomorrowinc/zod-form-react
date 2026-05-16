import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { FileUpload } from './file-upload';
import { StarRating } from './star-rating';

describe('shadcn primitives', () => {
  describe('Button', () => {
    it('renders children and reacts to click', async () => {
      const handler = vi.fn();
      render(<Button onClick={handler}>Save</Button>);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(handler).toHaveBeenCalled();
    });

    it('asChild renders the child element instead of <button>', () => {
      render(
        <Button asChild>
          <a href="/x">Link</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Link' });
      expect(link.tagName).toBe('A');
    });
  });

  describe('Input', () => {
    it('forwards value and onChange', async () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} placeholder="enter" />);
      await userEvent.type(screen.getByPlaceholderText('enter'), 'hi');
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Textarea', () => {
    it('renders and accepts input', async () => {
      const onChange = vi.fn();
      render(<Textarea onChange={onChange} placeholder="notes" />);
      await userEvent.type(screen.getByPlaceholderText('notes'), 'a');
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Label', () => {
    it('renders associated text', () => {
      render(<Label htmlFor="x">Field</Label>);
      expect(screen.getByText('Field')).toBeInTheDocument();
    });
  });

  describe('Checkbox', () => {
    it('toggles on user click', async () => {
      const onCheckedChange = vi.fn();
      render(<Checkbox aria-label="agree" onCheckedChange={onCheckedChange} />);
      await userEvent.click(screen.getByLabelText('agree'));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Switch', () => {
    it('toggles on click', async () => {
      const onCheckedChange = vi.fn();
      render(<Switch aria-label="notifications" onCheckedChange={onCheckedChange} />);
      await userEvent.click(screen.getByRole('switch', { name: 'notifications' }));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('RadioGroup', () => {
    it('selects an option', async () => {
      const onValueChange = vi.fn();
      render(
        <RadioGroup onValueChange={onValueChange} aria-label="r">
          <RadioGroupItem value="a" id="a" aria-label="opt-a" />
          <RadioGroupItem value="b" id="b" aria-label="opt-b" />
        </RadioGroup>,
      );
      await userEvent.click(screen.getByLabelText('opt-a'));
      expect(onValueChange).toHaveBeenCalledWith('a');
    });
  });

  describe('Select', () => {
    it('opens and selects an option', async () => {
      const onValueChange = vi.fn();
      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger aria-label="role">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>,
      );
      await userEvent.click(screen.getByRole('combobox', { name: 'role' }));
      await userEvent.click(await screen.findByText('Admin'));
      expect(onValueChange).toHaveBeenCalledWith('admin');
    });
  });

  describe('FileUpload', () => {
    it('renders dropzone messaging', () => {
      render(<FileUpload name="file" />);
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });

    it('accepts selected files via the hidden input', async () => {
      const onChange = vi.fn();
      const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
      const { container } = render(<FileUpload name="file" onChange={onChange} />);
      const hidden = container.querySelector('input[type=file]') as HTMLInputElement;
      await userEvent.upload(hidden, file);
      expect(onChange).toHaveBeenCalledWith(file);
    });

    it('rejects files larger than maxSize and surfaces error', async () => {
      const onChange = vi.fn();
      const big = new File(['x'.repeat(200)], 'big.bin');
      const { container } = render(<FileUpload name="file" maxSize={10} onChange={onChange} />);
      const hidden = container.querySelector('input[type=file]') as HTMLInputElement;
      await userEvent.upload(hidden, big);
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(/exceeds/i);
    });
  });

  describe('StarRating', () => {
    it('renders the configured number of stars', () => {
      render(<StarRating value={0} max={5} />);
      expect(screen.getAllByRole('radio')).toHaveLength(5);
    });

    it('reports the clicked star value', async () => {
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} max={5} />);
      const stars = screen.getAllByRole('radio');
      const third = stars[2];
      if (!third) throw new Error('expected a third star');
      await userEvent.click(third);
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('does not fire onChange when disabled', async () => {
      const onChange = vi.fn();
      render(<StarRating value={0} onChange={onChange} max={3} disabled />);
      const stars = screen.getAllByRole('radio');
      const first = stars[0];
      if (!first) throw new Error('expected a star');
      await userEvent.click(first);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
