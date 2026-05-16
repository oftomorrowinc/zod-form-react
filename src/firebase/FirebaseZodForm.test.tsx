import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'doc-1' })),
  collection: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }) },
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
}));

import { z } from 'zod';
import { FirebaseZodForm } from './FirebaseZodForm';
import type { Firestore } from 'firebase/firestore';

const schema = z.object({ name: z.string(), age: z.number() });

describe('FirebaseZodForm', () => {
  it('renders the loading state when a documentId is provided and snapshot has not arrived', () => {
    render(
      <FirebaseZodForm
        schema={schema}
        firestore={{} as Firestore}
        collection="users"
        documentId="abc"
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the inner ZodForm when no document id (loading=false)', async () => {
    render(<FirebaseZodForm schema={schema} firestore={{} as Firestore} collection="users" />);
    // Without a docId, useFirestoreForm starts with loading=false so the form renders.
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
