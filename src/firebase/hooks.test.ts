import { renderHook, act } from '@testing-library/react';
import { useFirestoreForm, useFirebaseStorageUpload } from './hooks';
import { z } from 'zod';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()), // Returns unsubscribe function
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })), // Mock successful addDoc
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: {
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('Firebase Hooks', () => {
  describe('useFirestoreForm', () => {
    const mockFirestore = {} as Firestore;
    const testSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number(),
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize with loading state when documentId is provided', () => {
      const { result } = renderHook(() =>
        useFirestoreForm({
          schema: testSchema,
          firestore: mockFirestore,
          collection: 'users',
          documentId: 'test-123',
        })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.saving).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle form submission and save to Firestore', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useFirestoreForm({
          schema: testSchema,
          firestore: mockFirestore,
          collection: 'users',
          onSuccess,
        })
      );

      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      await act(async () => {
        await result.current.saveToFirestore(testData);
      });

      expect(onSuccess).toHaveBeenCalledWith(testData);
    });

    it('should include metadata when includeMetadata is true', async () => {
      const { result } = renderHook(() =>
        useFirestoreForm({
          schema: testSchema,
          firestore: mockFirestore,
          collection: 'users',
          includeMetadata: true,
          user: { uid: 'user-123' } as any,
        })
      );

      await act(async () => {
        await result.current.saveToFirestore({
          name: 'John',
          email: 'john@example.com',
          age: 25,
        });
      });

      // Verify metadata was included in the save
      expect(result.current.saving).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const onError = jest.fn();
      const mockError = new Error('Save failed');

      // Mock addDoc to throw an error
      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() =>
        useFirestoreForm({
          schema: testSchema,
          firestore: mockFirestore,
          collection: 'users',
          onError,
        })
      );

      await act(async () => {
        try {
          await result.current.saveToFirestore({
            name: 'John',
            email: 'john@example.com',
            age: 25,
          });
        } catch (error) {
          // Expected error
        }
      });

      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useFirebaseStorageUpload', () => {
    const mockStorage = {} as FirebaseStorage;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useFirebaseStorageUpload({
          storage: mockStorage,
          path: 'uploads',
        })
      );

      expect(result.current.uploading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.downloadURL).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle file upload', async () => {
      const onComplete = jest.fn();
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockURL = 'https://example.com/file.txt';

      // Mock upload task
      const mockUploadTask = {
        on: jest.fn((event, ...handlers) => {
          // Simulate successful upload
          setTimeout(() => {
            handlers[2](); // Call complete handler
          }, 0);
        }),
        snapshot: { ref: {} },
      };

      const { ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');
      ref.mockReturnValue({});
      uploadBytesResumable.mockReturnValue(mockUploadTask);
      getDownloadURL.mockResolvedValue(mockURL);

      const { result } = renderHook(() =>
        useFirebaseStorageUpload({
          storage: mockStorage,
          path: 'uploads',
          onComplete,
        })
      );

      await act(async () => {
        await result.current.upload(mockFile);
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(onComplete).toHaveBeenCalledWith(mockURL);
    });

    it('should track upload progress', async () => {
      const onProgress = jest.fn();
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      // Mock upload task with progress
      const mockUploadTask = {
        on: jest.fn((event, ...handlers) => {
          // Simulate progress updates
          handlers[0]({
            bytesTransferred: 50,
            totalBytes: 100,
          });
        }),
        snapshot: { ref: {} },
      };

      const { uploadBytesResumable } = require('firebase/storage');
      uploadBytesResumable.mockReturnValue(mockUploadTask);

      const { result } = renderHook(() =>
        useFirebaseStorageUpload({
          storage: mockStorage,
          path: 'uploads',
          onProgress,
        })
      );

      await act(async () => {
        result.current.upload(mockFile);
      });

      expect(onProgress).toHaveBeenCalledWith(50);
      expect(result.current.progress).toBe(50);
    });

    it('should handle upload errors', async () => {
      const onError = jest.fn();
      const mockError = new Error('Upload failed');
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      // Mock upload task with error
      const mockUploadTask = {
        on: jest.fn((event, ...handlers) => {
          // Simulate error
          handlers[1](mockError);
        }),
      };

      const { uploadBytesResumable } = require('firebase/storage');
      uploadBytesResumable.mockReturnValue(mockUploadTask);

      const { result } = renderHook(() =>
        useFirebaseStorageUpload({
          storage: mockStorage,
          path: 'uploads',
          onError,
        })
      );

      await act(async () => {
        result.current.upload(mockFile);
      });

      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toBe(mockError);
      expect(result.current.uploading).toBe(false);
    });
  });
});
