import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';

const Harness: React.FC<{ defaultValues?: Record<string, unknown>; errorMessage?: string }> = ({
  defaultValues = { name: '' },
  errorMessage,
}) => {
  const methods = useForm({ defaultValues });
  React.useEffect(() => {
    if (errorMessage) {
      methods.setError('name', { type: 'manual', message: errorMessage });
    }
  }, [errorMessage, methods]);
  return (
    <Form {...methods}>
      <FormField
        control={methods.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} value={(field.value as string | undefined) ?? ''} />
            </FormControl>
            <FormDescription>Your full name</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
};

describe('shadcn Form helpers', () => {
  it('renders label, description, and input via FormField context', () => {
    render(<Harness />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Your full name')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders FormMessage when the field has an error', async () => {
    render(<Harness errorMessage="Required" />);
    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
