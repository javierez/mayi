# Audio Transcription Quick Start

## 🎯 Quick Integration Guide

Add audio transcription to any text input in 3 simple steps!

## Step 1: Add Environment Variable

Add to your `.env` file:
```bash
DEEPGRAM_API_KEY=your_api_key_here
```

Get your key from: https://console.deepgram.com/

## Step 2: Import the Component

```tsx
import { AudioTranscriptionButton } from "~/components/shared/audio-transcription-button";
```

## Step 3: Add to Your Form

```tsx
<div className="flex items-start gap-2">
  <Textarea
    {...form.register("description")}
    placeholder="Descripción..."
  />
  <AudioTranscriptionButton
    onTranscript={(text) => form.setValue("description", text)}
    language="es"
  />
</div>
```

That's it! 🎉

## Example: Adding to Property Form

```tsx
// src/components/propiedades/property-form.tsx
"use client";

import { AudioTranscriptionButton } from "~/components/shared/audio-transcription-button";

export function PropertyForm() {
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Title field */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input {...field} placeholder="Título de la propiedad" />
              </FormControl>
              <AudioTranscriptionButton
                onTranscript={(text) => field.onChange(text)}
                language="es"
              />
            </div>
          </FormItem>
        )}
      />

      {/* Description field */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <div className="flex items-start gap-2">
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe la propiedad..."
                  rows={5}
                />
              </FormControl>
              <AudioTranscriptionButton
                onTranscript={(text) => {
                  // Append to existing description
                  const current = field.value ?? "";
                  field.onChange(current ? `${current} ${text}` : text);
                }}
                language="es"
              />
            </div>
          </FormItem>
        )}
      />

      <Button type="submit">Guardar</Button>
    </form>
  );
}
```

## Usage Patterns

### Pattern 1: Replace Text
```tsx
<AudioTranscriptionButton
  onTranscript={(text) => form.setValue("field", text)}
/>
```

### Pattern 2: Append Text
```tsx
<AudioTranscriptionButton
  onTranscript={(text) => {
    const current = form.getValues("field") ?? "";
    form.setValue("field", current ? `${current} ${text}` : text);
  }}
/>
```

### Pattern 3: With Custom Formatting
```tsx
<AudioTranscriptionButton
  onTranscript={(text) => {
    const formatted = text.charAt(0).toUpperCase() + text.slice(1);
    form.setValue("field", formatted);
  }}
/>
```

## Styling Options

### Icon Button (Default)
```tsx
<AudioTranscriptionButton
  onTranscript={handleTranscript}
  variant="ghost"
  size="icon"
/>
```

### Regular Button
```tsx
<AudioTranscriptionButton
  onTranscript={handleTranscript}
  variant="outline"
  size="default"
/>
```

### Small Button
```tsx
<AudioTranscriptionButton
  onTranscript={handleTranscript}
  size="sm"
/>
```

## Real-world Examples

### Contact Notes
```tsx
<FormField
  control={form.control}
  name="notes"
  render={({ field }) => (
    <div className="flex items-start gap-2">
      <Textarea {...field} placeholder="Notas del contacto..." />
      <AudioTranscriptionButton
        onTranscript={(text) => field.onChange(text)}
      />
    </div>
  )}
/>
```

### Appointment Summary
```tsx
<div className="flex items-center gap-2">
  <Input
    {...form.register("summary")}
    placeholder="Resumen de la cita..."
  />
  <AudioTranscriptionButton
    onTranscript={(text) => form.setValue("summary", text)}
  />
</div>
```

### Search Box
```tsx
<div className="relative">
  <Input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Buscar propiedades..."
  />
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    <AudioTranscriptionButton
      onTranscript={setSearchQuery}
      size="icon"
    />
  </div>
</div>
```

## Advanced Usage

### With React Hook Form
```tsx
const form = useForm({
  defaultValues: {
    title: "",
    description: "",
  }
});

<AudioTranscriptionButton
  onTranscript={(text) => {
    form.setValue("description", text, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }}
/>
```

### With State Management
```tsx
const [description, setDescription] = useState("");

<AudioTranscriptionButton
  onTranscript={(text) => {
    setDescription(text);
    // Optionally save to database
    void saveDescription(text);
  }}
/>
```

## Cost Calculator

Use this to estimate your monthly costs:

```
Average recording length: 2 minutes
Recordings per day: 10
Days per month: 30

Monthly cost = 2 min × 10 × 30 × $0.0125/min
Monthly cost = $7.50/month
```

## Pricing Examples

| Usage | Daily | Monthly | Cost/Month |
|-------|-------|---------|------------|
| Light | 5 recordings × 2 min | 300 min | $3.75 |
| Medium | 20 recordings × 2 min | 1,200 min | $15.00 |
| Heavy | 50 recordings × 3 min | 4,500 min | $56.25 |

## Tips & Tricks

### 1. Best Audio Quality
- Use in quiet environment
- Speak clearly at normal pace
- Hold microphone close (if using external mic)

### 2. Better Accuracy
- Specify correct language
- Use real estate terminology
- Speak full sentences

### 3. User Experience
- Always show recording indicator
- Provide feedback during transcription
- Handle errors gracefully

### 4. Performance
- Keep recordings under 5 minutes
- Process in background
- Show loading states

## Troubleshooting

### Issue: No microphone access
**Fix:** Ensure you're using HTTPS and grant microphone permissions

### Issue: Transcription not working
**Fix:** Check that `DEEPGRAM_API_KEY` is set in `.env`

### Issue: Poor accuracy
**Fix:** Ensure correct language is set and audio quality is good

## Full Documentation

For complete documentation, see: `docs/AUDIO_TRANSCRIPTION.md`

## Questions?

- Check the full documentation
- Review the component source code
- Test with sample audio recordings
