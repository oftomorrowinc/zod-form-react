import * as React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(() =>
    Promise.resolve({
      docs: [
        { id: 'doc1', data: () => ({ name: 'Document 1' }) },
        { id: 'doc2', data: () => ({ name: 'Document 2' }) },
      ],
    }),
  ),
}));

const mockStorageHookState: {
  uploading: boolean;
  progress: number;
  downloadURL: string | null;
  error: Error | null;
} = { uploading: false, progress: 0, downloadURL: null, error: null };

vi.mock('./hooks', () => ({
  useFirebaseStorageUpload: vi.fn(() => ({
    upload: vi.fn(),
    ...mockStorageHookState,
  })),
}));

import {
  DocumentReferenceField,
  GeoPointField,
  ServerTimestampField,
  FirebaseStorageField,
} from './fields';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

const Wrapper: React.FC<{ children: React.ReactNode; defaultValues?: Record<string, unknown> }> = ({
  children,
  defaultValues = {},
}) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Firebase field components', () => {
  describe('DocumentReferenceField', () => {
    it('renders label and loads documents from the collection', async () => {
      render(
        <Wrapper>
          <DocumentReferenceField
            name="docRef"
            label="Pick doc"
            firestore={{} as Firestore}
            collection="users"
          />
        </Wrapper>,
      );
      expect(screen.getByText('Pick doc')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
  });

  describe('ServerTimestampField', () => {
    it('shows the current time when enabled', () => {
      render(
        <Wrapper>
          <ServerTimestampField name="ts" label="Updated" description="server time" />
        </Wrapper>,
      );
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('server time')).toBeInTheDocument();
      expect(screen.getByText('Will be set to:')).toBeInTheDocument();
    });

    it('shows a static message when showCurrentTime is false', () => {
      render(
        <Wrapper>
          <ServerTimestampField name="ts" showCurrentTime={false} />
        </Wrapper>,
      );
      expect(screen.getByText(/will be set to server timestamp on save/i)).toBeInTheDocument();
    });
  });

  describe('GeoPointField', () => {
    beforeEach(() => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true,
      });
    });

    it('renders latitude/longitude inputs with defaults', () => {
      render(
        <Wrapper>
          <GeoPointField name="loc" label="Location" defaultLat={40.7} defaultLng={-74} />
        </Wrapper>,
      );
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Latitude')).toHaveValue(40.7);
      expect(screen.getByPlaceholderText('Longitude')).toHaveValue(-74);
    });

    it('hides the geolocation button when disabled via flag', () => {
      render(
        <Wrapper>
          <GeoPointField name="loc" enableGeolocation={false} />
        </Wrapper>,
      );
      expect(screen.queryByRole('button', { name: /current location/i })).not.toBeInTheDocument();
    });
  });

  describe('FirebaseStorageField', () => {
    it('renders the file upload region with optional accept', () => {
      render(
        <Wrapper>
          <FirebaseStorageField
            name="file"
            label="Upload"
            description="pick a file"
            storage={{} as FirebaseStorage}
            path="uploads"
            accept="image/*"
          />
        </Wrapper>,
      );
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('pick a file')).toBeInTheDocument();
      expect(document.querySelector('input[type=file]')).toHaveAttribute('accept', 'image/*');
    });

    it('shows the uploading indicator when the storage hook reports progress', () => {
      mockStorageHookState.uploading = true;
      mockStorageHookState.progress = 42;
      try {
        render(
          <Wrapper>
            <FirebaseStorageField name="file" storage={{} as FirebaseStorage} path="uploads" />
          </Wrapper>,
        );
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      } finally {
        mockStorageHookState.uploading = false;
        mockStorageHookState.progress = 0;
      }
    });
  });
});
