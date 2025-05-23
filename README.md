# Zod Form React

A powerful React component library for generating beautiful, type-safe forms from Zod schemas. This is the React/TypeScript conversion of our original Node.js/Express Zod Form Node library, now optimized for modern React applications and Next.js.

## 🚀 Features

### ✅ **Completed Features**
- **Schema-Driven**: Automatically generate forms from Zod schemas with full type inference
- **React Hook Form Integration**: Built on React Hook Form for optimal performance and developer experience
- **TypeScript First**: Complete TypeScript support with proper type inference from your Zod schemas
- **Dark Theme by Default**: Beautiful dark theme that matches the original library's aesthetic
- **Tailwind CSS**: Modern styling with Tailwind CSS and CSS custom properties for easy theming
- **Comprehensive Field Types**: Support for all standard form fields plus enhanced components
- **Real-time Validation**: Instant validation feedback with customizable validation modes
- **Responsive Design**: Mobile-first responsive design that works on all screen sizes

### 🚧 **In Development**
- **Enhanced Components**: Star ratings, file uploads with preview, and document upload integration
- **Dynamic Arrays**: Add/remove functionality for array fields with drag-and-drop reordering
- **Nested Objects**: Collapsible object fields with proper validation nesting
- **Conditional Logic**: Show/hide fields based on form state and user selections

## 📦 Installation

```bash
npm install zod-form-react zod react-hook-form @hookform/resolvers
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

### Immediate Next Steps
1. **Fix TypeScript Build Issues**: Resolve current compilation errors
2. **Enhanced Component Integration**: Complete star rating, file upload, and array field implementations
3. **Comprehensive Testing**: Add Jest and React Testing Library test suite
4. **Storybook Documentation**: Interactive component documentation

### Future Enhancements
1. **Additional Field Types**: Color picker, rich text editor, date range picker
2. **Advanced Validation**: Async validation, cross-field validation
3. **Accessibility**: Complete ARIA implementation and keyboard navigation
4. **Performance**: Virtualization for large forms, optimized re-renders
5. **Integrations**: Headless UI components, Chakra UI, Material-UI adapters

## 🔄 Migration from Original

This React library maintains the core philosophy and features of the original Node.js/Express Zod Form Node:

### ✅ **Preserved Features**
- Schema-driven form generation
- Automatic field type detection
- Dark theme aesthetic
- Enhanced field types (star ratings, file uploads)
- Validation integration
- Template system (now component-based)

### 🔄 **Modernized**
- React components instead of server-side rendering
- TypeScript with full type safety
- React Hook Form for performance
- Tailwind CSS for styling
- Component-based architecture

### 📈 **Enhanced**
- Better TypeScript integration
- More flexible theming system
- Improved accessibility
- Mobile-first responsive design
- Modern React patterns (hooks, context, etc.)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the React community**