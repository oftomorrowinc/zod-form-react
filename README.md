# Zod Form React

A Firebase-first React form library that generates beautiful, type-safe forms from Zod schemas with built-in Firestore integration, Firebase Auth support, and Firebase Storage handling. Optimized for Next.js applications hosted on Firebase.

## 🚀 Features

### ✅ **Core Features**

#### 🔥 Firebase Integration
- **Firebase-First Design**: Built specifically for Firebase-powered applications
- **Firestore Integration**: Automatic document saving, real-time sync, and auto-save functionality
- **Firebase Auth**: User context awareness and automatic metadata tracking
- **Firebase Storage**: Direct file upload to Storage with progress tracking
- **Firebase Emulator Support**: Full support for local development with emulators
- **Environment Variable Configuration**: Secure configuration through environment variables

#### 📝 Form Generation & Validation
- **Schema-Driven**: Automatically generate forms from Zod schemas with full type inference
- **React Hook Form Integration**: Built on React Hook Form for optimal performance
- **Real-time Validation**: Instant validation feedback with Zod schemas
- **TypeScript First**: Complete TypeScript support with proper type inference

#### 🎨 UI & Components
- **Dark Theme by Default**: Beautiful dark theme optimized for developer tools
- **Tailwind CSS**: Modern styling with CSS custom properties for easy theming
- **Responsive Design**: Mobile-first responsive design
- **Enhanced Components**: Star ratings, file uploads with preview, rich text editing
- **Dynamic Arrays**: Add/remove functionality for array fields
- **Nested Objects**: Support for complex nested data structures
- **Conditional Logic**: Show/hide fields based on form state and user selections

#### 🚀 Firebase-Specific Field Types
- **ServerTimestamp**: Automatic server timestamp fields
- **GeoPoint**: Location fields with geolocation support
- **DocumentReference**: Select and reference other Firestore documents
- **FirebaseStorage**: File upload fields with progress tracking

## 📦 Installation

```bash
npm install zod-form-react

# Peer dependencies (if not already installed)
npm install react react-dom zod react-hook-form @hookform/resolvers
```

**Note**: Firebase is included as a dependency, so you don't need to install it separately.

## 🚀 Quick Start with Firebase

```bash
# 1. Install the library
npm install zod-form-react

# 2. Set up your .env.local file
cp node_modules/zod-form-react/.env.example .env.local
# Edit .env.local with your Firebase config

# 3. Start Firebase emulators (optional for local dev)
npm run emulators

# 4. Start your Next.js app
npm run dev
```

## 🛠 Usage

### Basic Example

```tsx
import { z } from 'zod';
import { ZodForm } from 'zod-form-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
});

function MyForm() {
  const handleSubmit = (data) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  return (
    <ZodForm
      schema={userSchema}
      onSubmit={handleSubmit}
      submitButtonText="Create User"
      theme="dark"
    />
  );
}
```

### Advanced Example with Field Configuration

```tsx
import { z } from 'zod';
import { ZodForm } from 'zod-form-react';

const profileSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.boolean(),
    rating: z.number().min(1).max(5),
  }),
  skills: z.array(z.string()).min(1, 'At least one skill required'),
});

function AdvancedForm() {
  return (
    <ZodForm
      schema={profileSchema}
      onSubmit={(data) => console.log(data)}
      layout="grid"
      fieldOptions={{
        'preferences.rating': {
          type: 'stars',
          maxStars: 5,
          showValue: true,
        },
        'profile.email': {
          placeholder: 'Enter your email address',
          description: 'We will never share your email',
        },
        skills: {
          addButtonText: 'Add Skill',
          minItems: 1,
          maxItems: 10,
        },
      }}
    />
  );
}
```

### Using with Next.js

The library works seamlessly with Next.js. Check out our [complete Next.js demo](./examples/nextjs-demo/) for a full implementation.

```tsx
// pages/contact.tsx or app/contact/page.tsx
'use client'; // For App Router

import { z } from 'zod';
import { ZodForm } from 'zod-form-react';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(20),
  contactMethod: z.enum(['email', 'phone', 'text']),
});

export default function ContactPage() {
  const handleSubmit = async (data) => {
    // Server Action or API route
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      alert('Message sent successfully!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      <ZodForm
        schema={contactSchema}
        onSubmit={handleSubmit}
        theme="dark"
        submitButtonText="Send Message"
      />
    </div>
  );
}
```

## 🔥 Firebase Integration

### Setting Up Firebase

1. **Initialize Firebase in your Next.js app**:

```tsx
// lib/firebase.ts
import { initializeFirebase } from 'zod-form-react/firebase';

export const { firestore, auth, storage } = initializeFirebase({
  // Option 1: Pass config directly
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
  
  // Option 2: Use environment variables (recommended)
  // Config will be read from NEXT_PUBLIC_FIREBASE_* env vars
});
```

2. **Environment Variables** (.env.local):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Optional: Enable emulators in development
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

### FirebaseZodForm - Firestore Integration

```tsx
import { z } from 'zod';
import { FirebaseZodForm } from 'zod-form-react/firebase';
import { firestore, auth, storage } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const profileSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  bio: z.string().optional(),
  photoURL: z.string().url().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
  updatedAt: z.date(), // Will use serverTimestamp()
});

function ProfileForm() {
  const [user] = useAuthState(auth);
  
  return (
    <FirebaseZodForm
      schema={profileSchema}
      firestore={firestore}
      storage={storage}
      collection="users"
      documentId={user?.uid}
      user={user}
      autoSave={true}
      autoSaveDelay={2000}
      includeMetadata={true}
      onSuccess={(data) => {
        console.log('Profile saved:', data);
      }}
      theme="dark"
      submitButtonText="Save Profile"
    />
  );
}
```

#### 📝 Document ID Behavior

- **New Documents**: When no `documentId` is provided, Firestore automatically generates a unique document ID
- **Existing Documents**: Provide a `documentId` to update an existing document
- **User Profiles**: Common pattern is to use the Firebase Auth UID as the document ID (as shown above)
- **Custom IDs**: You can provide any string as a `documentId` if you need specific ID formats

```tsx
// Example: Auto-generated ID (new document)
<FirebaseZodForm
  schema={schema}
  firestore={firestore}
  collection="posts"
  // No documentId = Firestore generates one
/>

// Example: Specific ID (update existing)
<FirebaseZodForm
  schema={schema}
  firestore={firestore}
  collection="posts"
  documentId="post-123"
/>
```

### Firebase-Specific Field Types

```tsx
import { z } from 'zod';
import { FirebaseZodForm } from 'zod-form-react/firebase';
import { 
  DocumentReferenceField, 
  ServerTimestampField, 
  GeoPointField,
  FirebaseStorageField 
} from 'zod-form-react/firebase';

const eventSchema = z.object({
  title: z.string().min(5),
  description: z.string(),
  
  // Document reference to another collection
  organizerId: z.string(),
  
  // Server timestamp
  createdAt: z.date(),
  scheduledAt: z.date(),
  
  // GeoPoint for location
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  
  // File upload to Firebase Storage
  coverImage: z.string().url().optional(),
  attachments: z.array(z.string().url()).optional(),
});

function EventForm() {
  return (
    <FirebaseZodForm
      schema={eventSchema}
      firestore={firestore}
      storage={storage}
      collection="events"
      fieldOptions={{
        organizerId: {
          component: DocumentReferenceField,
          props: {
            firestore,
            collection: 'users',
            displayField: 'displayName',
          },
        },
        createdAt: {
          component: ServerTimestampField,
          props: {
            showCurrentTime: true,
          },
        },
        location: {
          component: GeoPointField,
          props: {
            enableGeolocation: true,
          },
        },
        coverImage: {
          component: FirebaseStorageField,
          props: {
            storage,
            path: 'event-covers',
            accept: 'image/*',
            showPreview: true,
          },
        },
      }}
    />
  );
}
```

### Real-time Form Sync with Firestore

```tsx
import { useFirestoreForm } from 'zod-form-react/firebase';

function RealtimeForm() {
  const {
    loading,
    saving,
    error,
    documentId,
    saveToFirestore,
    register,
    handleSubmit,
    watch,
    formState,
  } = useFirestoreForm({
    schema: mySchema,
    firestore,
    collection: 'drafts',
    documentId: 'draft-123', // Optional: specific document
    autoSave: true,
    autoSaveDelay: 1000,
    user: currentUser,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <form onSubmit={handleSubmit(saveToFirestore)}>
      {/* Your form fields */}
      <input {...register('title')} />
      
      {saving && <p>Saving...</p>}
      {documentId && <p>Document ID: {documentId}</p>}
    </form>
  );
}
```

### Firebase Auth Integration

```tsx
import { FirebaseZodForm } from 'zod-form-react/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

function AuthenticatedForm() {
  const [user, loading, error] = useAuthState(auth);
  
  if (loading) return <div>Loading auth...</div>;
  if (error) return <div>Auth error: {error.message}</div>;
  if (!user) return <div>Please sign in to continue</div>;
  
  return (
    <FirebaseZodForm
      schema={schema}
      firestore={firestore}
      collection="user-data"
      documentId={user.uid}
      user={user}
      includeMetadata={true} // Adds createdBy, updatedBy, timestamps
      transformBeforeSave={(data) => ({
        ...data,
        userEmail: user.email,
        userId: user.uid,
      })}
    />
  );
}
```

### Firebase Emulator Support

```bash
# Start Firebase emulators
npm run emulators

# Start with data import
npm run emulators:import

# Export emulator data
npm run emulators:export
```

Configure for emulators in development:

```tsx
// Automatically connects to emulators when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
const { firestore, auth, storage } = initializeFirebase(null, {
  useEmulators: true,
  emulatorHost: 'localhost',
  firestorePort: 8080,
  authPort: 9099,
  storagePort: 9199,
});
```

## 🎨 Theming

The library includes a comprehensive theming system with CSS custom properties:

```css
:root {
  --zf-primary-color: #6366f1;
  --zf-secondary-color: #8b5cf6;
  --zf-background: #0f172a;
  --zf-surface: #1e293b;
  --zf-border: #334155;
  --zf-text: #f8fafc;
  --zf-text-muted: #94a3b8;
  --zf-error: #ef4444;
  --zf-success: #10b981;
}
```

## 📋 Field Types

The library automatically maps Zod schema types to appropriate form fields:

| Zod Type | Form Field | Notes |
|----------|------------|-------|
| `z.string()` | Text input | |
| `z.string().email()` | Email input | With validation |
| `z.string().url()` | URL input | With validation |
| `z.string().min(100)` | Textarea | For long text |
| `z.number()` | Number input | |
| `z.number().min(1).max(5)` | Range slider | For small ranges |
| `z.boolean()` | Checkbox | |
| `z.date()` | Date picker | |
| `z.enum([...])` | Select dropdown | Or radio buttons for ≤4 options |
| `z.array(...)` | Dynamic array | Add/remove functionality |
| `z.object({...})` | Nested fieldset | Collapsible sections |

### Firebase-Specific Field Types

| Field Type | Use Case | Features |
|------------|----------|----------|
| `DocumentReferenceField` | Reference other Firestore documents | Document picker with search |
| `ServerTimestampField` | Automatic timestamps | Shows current time, saves as serverTimestamp() |
| `GeoPointField` | Location data | Latitude/longitude inputs with geolocation |
| `FirebaseStorageField` | File uploads | Direct upload to Firebase Storage with progress |

## 🔧 Configuration Options

### ZodForm Props

```tsx
interface ZodFormConfig {
  schema: ZodSchema;
  onSubmit: (data: any) => void | Promise<void>;
  
  // Theming
  theme?: 'dark' | 'light' | 'auto';
  
  // Layout  
  layout?: 'vertical' | 'horizontal' | 'grid';
  
  // Field customization
  fieldOptions?: Record<string, FieldConfig>;
  
  // Form behavior
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: any;
  
  // UI options
  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  
  // States
  loading?: boolean;
  disabled?: boolean;
}
```

### Field Configuration

```tsx
interface FieldConfig {
  type?: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  
  // Enhanced features
  documentUpload?: boolean;
  imagePreview?: boolean;
  maxStars?: number;
  
  // Array/Object
  addButtonText?: string;
  minItems?: number;
  maxItems?: number;
  
  // Conditional logic
  showWhen?: {
    field: string;
    value: any;
    operator?: 'equals' | 'not-equals' | 'greater-than';
  };
  
  // Styling
  className?: string;
  containerClassName?: string;
}
```

## 🧪 Development

### Running the Demo

```bash
# Install dependencies
npm install

# Start the Next.js demo
npm run example:dev
```

The demo will be available at `http://localhost:3001` and showcases:
- Basic form generation from Zod schemas
- Complex nested forms with objects and arrays
- Real-time validation and error handling
- Dark theme implementation
- TypeScript integration

### Building the Library

```bash
# Build the library
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 🗺 Roadmap

### ✅ Recently Completed
- **Firebase Integration**: Full Firestore, Auth, and Storage support
- **Enhanced Components**: Star ratings, file uploads with preview
- **Dynamic Arrays**: Full array field support with add/remove
- **Nested Objects**: Complex nested data structures
- **Conditional Logic**: Dynamic field visibility
- **Firebase-Specific Fields**: ServerTimestamp, GeoPoint, DocumentReference
- **Environment Configuration**: Secure config through env variables

### 💡 Possible Future Enhancements

Let us know which features you'd like to see!
1. **Additional Field Types**: 
   - Color picker
   - Rich text editor (with Firebase Storage for images)
   - Date range picker
   - Multi-select with search
2. **Advanced Firebase Features**:
   - Offline persistence configuration
   - Security rules generator from Zod schemas
   - Cloud Functions integration for form processing
   - Firebase Analytics event tracking
3. **Developer Experience**:
   - CLI tool for scaffolding forms
   - VS Code extension for Zod schema snippets
   - Form migration tool from other libraries
4. **Accessibility**: Enhanced ARIA support and keyboard navigation
5. **Performance**: 
   - Virtualization for large forms
   - Lazy loading for Firebase document references
   - Optimistic UI updates

## 🔄 Evolution from Zod Form Node

This library evolved from the original Node.js/Express Zod Form Node, now reimagined as a Firebase-first React solution:

### ✅ **Preserved Core Philosophy**
- Schema-driven form generation
- Automatic field type detection
- Dark theme aesthetic
- Enhanced field types (star ratings, file uploads)
- Validation integration

### 🚀 **Transformed for Firebase**
- **From Express to Firebase**: Built for Firebase App Hosting
- **From Server-Side to React**: Modern component architecture
- **From Templates to Components**: Flexible, composable UI
- **From SQL to Firestore**: NoSQL-optimized data handling
- **From Sessions to Firebase Auth**: Modern authentication

### 📈 **New Capabilities**
- **Real-time Sync**: Live form updates with Firestore
- **Auto-save**: Debounced saves to prevent data loss
- **File Storage**: Direct Firebase Storage integration
- **User Context**: Automatic user tracking and permissions
- **Offline Support**: Firebase's offline persistence
- **Type Safety**: End-to-end TypeScript with Zod

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the React community**