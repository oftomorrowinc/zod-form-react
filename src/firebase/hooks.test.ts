import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { z } from 'zod';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'doc-1' })),
  collection: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
}));

import { useFirestoreForm, useFirebaseStorageUpload } from './hooks';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

describe('useFirestoreForm', () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes loading=false when no document id is provided', () => {
    const { result } = renderHook(() =>
      useFirestoreForm({ schema, firestore: {} as Firestore, collection: 'users' }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes loading=true when a documentId is supplied', () => {
    const { result } = renderHook(() =>
      useFirestoreForm({
        schema,
        firestore: {} as Firestore,
        collection: 'users',
        documentId: 'x',
      }),
    );
    expect(result.current.loading).toBe(true);
  });

  it('saveToFirestore creates a new doc via addDoc and remembers its id', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useFirestoreForm({
        schema,
        firestore: {} as Firestore,
        collection: 'users',
        onSuccess,
        includeMetadata: false,
      }),
    );

    await act(async () => {
      await result.current.saveToFirestore({ name: 'A', age: 1 });
    });

    const { addDoc } = await import('firebase/firestore');
    expect(addDoc).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ name: 'A', age: 1 });
    await waitFor(() => expect(result.current.documentId).toBe('doc-1'));
  });

  it('saveToFirestore stamps metadata when includeMetadata is true', async () => {
    const { result } = renderHook(() =>
      useFirestoreForm({
        schema,
        firestore: {} as Firestore,
        collection: 'users',
        includeMetadata: true,
        user: { uid: 'u-1' } as never,
      }),
    );
    await act(async () => {
      await result.current.saveToFirestore({ name: 'A', age: 1 });
    });
    const { addDoc } = await import('firebase/firestore');
    const call = (addDoc as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[1]?._metadata?.createdBy).toBe('u-1');
  });

  it('saveToFirestore throws if neither collection nor documentRef is provided', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFirestoreForm({ schema, firestore: {} as Firestore, onError, includeMetadata: false }),
    );
    await expect(
      act(async () => {
        await result.current.saveToFirestore({ name: 'A', age: 1 });
      }),
    ).rejects.toThrow(/collection.*documentRef/);
    expect(onError).toHaveBeenCalled();
  });
});

describe('useFirebaseStorageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports default state', () => {
    const { result } = renderHook(() =>
      useFirebaseStorageUpload({ storage: {} as FirebaseStorage, path: 'uploads' }),
    );
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.downloadURL).toBeNull();
  });

  it('completes upload and fires onComplete with the URL', async () => {
    const onComplete = vi.fn();
    const fakeUrl = 'https://example.com/x.txt';
    const { uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
    (uploadBytesResumable as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: (_evt: string, _onProgress: unknown, _onError: unknown, onDone: () => void) => {
        setTimeout(onDone, 0);
      },
      snapshot: { ref: {} },
    });
    (getDownloadURL as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeUrl);

    const { result } = renderHook(() =>
      useFirebaseStorageUpload({ storage: {} as FirebaseStorage, path: 'uploads', onComplete }),
    );

    await act(async () => {
      await result.current.upload(new File(['x'], 'a.txt'));
    });
    expect(onComplete).toHaveBeenCalledWith(fakeUrl);
  });

  it('tracks progress callbacks', async () => {
    const onProgress = vi.fn();
    const { uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
    (uploadBytesResumable as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: (
        _evt: string,
        onProgressCb: (snap: { bytesTransferred: number; totalBytes: number }) => void,
        _onError: unknown,
        onDone: () => void,
      ) => {
        onProgressCb({ bytesTransferred: 50, totalBytes: 100 });
        setTimeout(onDone, 0);
      },
      snapshot: { ref: {} },
    });
    (getDownloadURL as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'https://example.com/x',
    );
    const { result } = renderHook(() =>
      useFirebaseStorageUpload({ storage: {} as FirebaseStorage, path: 'uploads', onProgress }),
    );
    await act(async () => {
      await result.current.upload(new File(['x'], 'a.txt'));
    });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('surfaces upload errors', async () => {
    const onError = vi.fn();
    const err = new Error('boom');
    const { uploadBytesResumable } = await import('firebase/storage');
    (uploadBytesResumable as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      on: (_evt: string, _onProgress: unknown, onErrorCb: (e: Error) => void) => {
        onErrorCb(err);
      },
      snapshot: { ref: {} },
    });
    const { result } = renderHook(() =>
      useFirebaseStorageUpload({ storage: {} as FirebaseStorage, path: 'uploads', onError }),
    );
    await act(async () => {
      try {
        await result.current.upload(new File(['x'], 'a.txt'));
      } catch {
        // expected reject
      }
    });
    expect(onError).toHaveBeenCalledWith(err);
    expect(result.current.error).toBe(err);
  });
});
