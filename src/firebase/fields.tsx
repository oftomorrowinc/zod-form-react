import React, { useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { collection, query, getDocs } from 'firebase/firestore';
import { Input } from '../components/ui/Input';
import { FieldError } from 'react-hook-form';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Description } from '../components/ui/Description';
import { FileUpload } from '../components/ui/FileUpload';
import { useFirebaseStorageUpload } from './hooks';
import { FirebaseStorage } from 'firebase/storage';

interface BaseFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Document Reference Field
interface DocumentReferenceFieldProps extends BaseFieldProps {
  firestore: any; // Firestore instance
  collection: string;
  displayField?: string;
  queryConstraints?: any[];
  placeholder?: string;
}

export const DocumentReferenceField: React.FC<DocumentReferenceFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  firestore,
  collection: collectionName,
  displayField = 'name',
  queryConstraints = [],
  placeholder = 'Select a document',
  className,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const [documents, setDocuments] = useState<Array<{ id: string; data: any }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const collectionRef = collection(firestore, collectionName);
        const q =
          queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [firestore, collectionName, queryConstraints]);

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      {description && <Description>{description}</Description>}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            id={name}
            disabled={disabled || loading}
            error={errors[name] as FieldError | undefined}
            options={documents.map(doc => ({
              value: doc.id,
              label: doc.data[displayField] || doc.id,
            }))}
            emptyOption={placeholder}
          />
        )}
      />

      {errors[name] && <ErrorMessage>{(errors[name] as any)?.message}</ErrorMessage>}
    </div>
  );
};

// Server Timestamp Field
interface ServerTimestampFieldProps extends BaseFieldProps {
  showCurrentTime?: boolean;
  format?: (date: Date) => string;
}

export const ServerTimestampField: React.FC<ServerTimestampFieldProps> = ({
  name,
  label,
  description,
  showCurrentTime = true,
  format = date => date.toLocaleString(),
  className,
}) => {
  const { control } = useFormContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (showCurrentTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showCurrentTime]);

  return (
    <div className={className}>
      {label && <Label htmlFor={name}>{label}</Label>}
      {description && <Description>{description}</Description>}

      <Controller
        name={name}
        control={control}
        defaultValue={null}
        render={() => (
          <div className="p-3 bg-gray-900 rounded-md text-gray-300">
            {showCurrentTime ? (
              <>
                <div className="text-sm text-gray-500">Will be set to:</div>
                <div className="font-mono">{format(currentTime)}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Will be set to server timestamp on save</div>
            )}
          </div>
        )}
      />
    </div>
  );
};

// GeoPoint Field
interface GeoPointFieldProps extends BaseFieldProps {
  defaultLat?: number;
  defaultLng?: number;
  enableGeolocation?: boolean;
}

export const GeoPointField: React.FC<GeoPointFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  defaultLat = 0,
  defaultLng = 0,
  enableGeolocation = true,
  className,
}) => {
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext();
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setValue(`${name}.latitude`, position.coords.latitude);
        setValue(`${name}.longitude`, position.coords.longitude);
        setGettingLocation(false);
      },
      error => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setGettingLocation(false);
      }
    );
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      {description && <Description>{description}</Description>}

      <div className="space-y-2">
        <Controller
          name={`${name}.latitude`}
          control={control}
          defaultValue={defaultLat}
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              step="any"
              placeholder="Latitude"
              disabled={disabled}
              error={errors[name] ? (errors[name] as any).latitude : undefined}
            />
          )}
        />

        <Controller
          name={`${name}.longitude`}
          control={control}
          defaultValue={defaultLng}
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              step="any"
              placeholder="Longitude"
              disabled={disabled}
              error={errors[name] ? (errors[name] as any).longitude : undefined}
            />
          )}
        />

        {enableGeolocation && (
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={disabled || gettingLocation}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {gettingLocation ? 'Getting location...' : 'Use Current Location'}
          </button>
        )}
      </div>

      {errors[name] && <ErrorMessage>{(errors[name] as any)?.message}</ErrorMessage>}
    </div>
  );
};

// Firebase Storage Field
interface FirebaseStorageFieldProps extends BaseFieldProps {
  storage: FirebaseStorage;
  path: string;
  accept?: string;
  maxSize?: number;
  showPreview?: boolean;
  multiple?: boolean;
}

export const FirebaseStorageField: React.FC<FirebaseStorageFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  storage,
  path,
  accept,
  maxSize,
  showPreview = true,
  multiple = false,
  className,
}) => {
  const { control, setValue, watch } = useFormContext();
  const fieldValue = watch(name);
  const [previews, setPreviews] = useState<string[]>([]);

  const { upload, uploading, progress } = useFirebaseStorageUpload({
    storage,
    path,
    onComplete: url => {
      if (multiple) {
        const currentUrls = fieldValue || [];
        setValue(name, [...currentUrls, url]);
      } else {
        setValue(name, url);
      }
    },
  });

  const handleFileChange = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Generate previews
    if (showPreview) {
      const newPreviews = await Promise.all(
        fileArray.map(file => {
          return new Promise<string>(resolve => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            } else {
              resolve('');
            }
          });
        })
      );
      setPreviews(newPreviews.filter(Boolean));
    }

    // Upload files
    for (const file of fileArray) {
      await upload(file);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      {description && <Description>{description}</Description>}

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, ...field } }) => (
          <div className="space-y-2">
            <FileUpload
              {...field}
              onChange={handleFileChange}
              accept={accept}
              multiple={multiple}
              disabled={disabled || uploading}
            />

            {uploading && (
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Uploading...</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ '--progress': `${progress}%`, width: 'var(--progress)' } as React.CSSProperties}
                  />
                </div>
              </div>
            )}

            {showPreview && previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            )}

            {value && !uploading && (
              <div className="text-sm text-green-500">✓ File uploaded successfully</div>
            )}
          </div>
        )}
      />
    </div>
  );
};
