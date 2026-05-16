import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  collection,
  getDocs,
  query,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileUpload } from '../components/ui/file-upload';
import { Button } from '../components/ui/button';
import { useFirebaseStorageUpload } from './hooks';

interface BaseFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface DocumentReferenceFieldProps extends BaseFieldProps {
  firestore: Firestore;
  collection: string;
  displayField?: string;
  queryConstraints?: QueryConstraint[];
  placeholder?: string;
}

/**
 * Renders a select whose options come from a Firestore collection. The selected
 * document's ID is what gets written to the form value.
 */
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
  placeholder = 'Select…',
  className,
}) => {
  const { control } = useFormContext();
  const [documents, setDocuments] = React.useState<
    Array<{ id: string; data: Record<string, unknown> }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const ref = collection(firestore, collectionName);
        const q = queryConstraints.length ? query(ref, ...queryConstraints) : ref;
        const snap = await getDocs(q);
        if (cancelled) return;
        setDocuments(
          snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [firestore, collectionName, queryConstraints]);

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={(field.value as string | undefined) ?? undefined}
            onValueChange={(v) => field.onChange(v)}
            disabled={disabled || loading}
            name={name}
          >
            <SelectTrigger id={name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {String(d.data[displayField] ?? d.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
};

interface ServerTimestampFieldProps extends BaseFieldProps {
  showCurrentTime?: boolean;
  format?: (date: Date) => string;
}

/**
 * Placeholder UI for a field whose value is a Firestore serverTimestamp().
 * Doesn't bind to react-hook-form — the actual server timestamp is applied at
 * save time by useFirestoreForm.
 */
export const ServerTimestampField: React.FC<ServerTimestampFieldProps> = ({
  name,
  label,
  description,
  showCurrentTime = true,
  format = (d) => d.toLocaleString(),
  className,
}) => {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    if (!showCurrentTime) return undefined;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [showCurrentTime]);

  return (
    <div className={className} data-field={name}>
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="rounded-md border bg-muted p-3 text-sm">
        {showCurrentTime ? (
          <>
            <div className="text-xs text-muted-foreground">Will be set to:</div>
            <div className="font-mono">{format(now)}</div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            Will be set to server timestamp on save
          </div>
        )}
      </div>
    </div>
  );
};

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
  const { control, setValue } = useFormContext();
  const [busy, setBusy] = React.useState(false);

  const useCurrent = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue(`${name}.latitude`, pos.coords.latitude);
        setValue(`${name}.longitude`, pos.coords.longitude);
        setBusy(false);
      },
      () => setBusy(false),
    );
  };

  return (
    <div className={className} data-field={name}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
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
              onChange={(e) => field.onChange(Number(e.target.value))}
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
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
        {enableGeolocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrent}
            disabled={disabled || busy}
          >
            {busy ? 'Getting location…' : 'Use current location'}
          </Button>
        )}
      </div>
    </div>
  );
};

interface FirebaseStorageFieldProps extends BaseFieldProps {
  storage: FirebaseStorage;
  path: string;
  accept?: string;
  maxSize?: number;
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
  multiple = false,
  className,
}) => {
  const { control, setValue, watch } = useFormContext();
  const value = watch(name);

  const { upload, uploading, progress } = useFirebaseStorageUpload({
    storage,
    path,
    onComplete: (url) => {
      if (multiple) {
        const current = (value as string[] | undefined) ?? [];
        setValue(name, [...current, url]);
      } else {
        setValue(name, url);
      }
    },
  });

  const handleFiles = async (files: File | File[] | null) => {
    if (!files) return;
    const arr = Array.isArray(files) ? files : [files];
    for (const f of arr) {
      await upload(f);
    }
  };

  return (
    <div className={className} data-field={name}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Controller
        name={name}
        control={control}
        render={() => (
          <div className="space-y-2">
            <FileUpload
              accept={accept}
              maxSize={maxSize}
              multiple={multiple}
              disabled={disabled || uploading}
              onChange={(files) => void handleFiles(files)}
            />
            {uploading && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Uploading…</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {value && !uploading && (
              <p className="text-sm text-muted-foreground">File uploaded successfully.</p>
            )}
          </div>
        )}
      />
    </div>
  );
};
