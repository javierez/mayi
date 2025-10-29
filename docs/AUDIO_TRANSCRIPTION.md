# Audio Transcription with Deepgram Nova-3

This documentation explains how to use the audio transcription feature in Vesta, powered by Deepgram's Nova-3 model.

## Overview

The transcription system allows users to:
- Record audio directly from their microphone
- Transcribe audio to text in real-time
- Support for Spanish and multiple languages
- High accuracy with ~300ms latency
- Cost-effective at $0.0125/minute (pay-as-you-go)

## Setup

### 1. Environment Variables

Add your Deepgram API key to `.env`:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

Get your API key from: https://console.deepgram.com/

### 2. Cost Estimation

**Deepgram Nova-3 Pricing:**
- Pay-as-you-go: $0.0125/minute
- Volume discount: $0.0043/minute (with 4k/year commitment)

**Expected costs for typical usage:**
- 100 recordings × 2 min = $2.50/month
- 500 recordings × 2 min = $12.50/month
- 1000 recordings × 3 min = $37.50/month

## Usage

### Basic Component Usage

```tsx
import { AudioTranscriptionButton } from "~/components/shared/audio-transcription-button";

export function PropertyForm() {
  const form = useForm();

  return (
    <div className="flex items-center gap-2">
      <Textarea
        {...form.register("description")}
        placeholder="Descripción de la propiedad..."
      />
      <AudioTranscriptionButton
        onTranscript={(text) => {
          form.setValue("description", text);
        }}
        language="es"
      />
    </div>
  );
}
```

### Server Action Usage

```tsx
import { transcribeAudio } from "~/server/actions/transcription";

// Transcribe from Buffer
const audioBuffer = await file.arrayBuffer();
const result = await transcribeAudio(Buffer.from(audioBuffer), {
  language: "es",
  model: "nova-3",
  smartFormat: true,
  punctuate: true,
});

if (result.success) {
  console.log(result.transcript);
}
```

### Transcribe from URL

```tsx
import { transcribeAudioUrl } from "~/server/actions/transcription";

const result = await transcribeAudioUrl(
  "https://example.com/audio.mp3",
  { language: "es" }
);
```

## Component API

### AudioTranscriptionButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onTranscript` | `(text: string) => void` | **required** | Callback when transcription completes |
| `language` | `string` | `"es"` | Language code (es, en, fr, etc.) |
| `variant` | `"default" \| "ghost" \| "outline"` | `"ghost"` | Button style variant |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"icon"` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |

## Server Action API

### transcribeAudio()

Transcribes audio from a Buffer.

**Parameters:**
- `audioFile: Buffer` - Audio file as Buffer
- `options?: object` - Optional configuration
  - `language?: string` - Language code (default: "es")
  - `model?: string` - Model name (default: "nova-3")
  - `smartFormat?: boolean` - Smart formatting (default: true)
  - `punctuate?: boolean` - Add punctuation (default: true)
  - `diarize?: boolean` - Speaker diarization (default: false)

**Returns:**
```typescript
{
  success: boolean;
  transcript?: string;
  language?: string;
  error?: string;
}
```

### transcribeAudioUrl()

Transcribes audio from a public URL.

**Parameters:**
- `audioUrl: string` - Public URL of audio file
- `options?: object` - Same as transcribeAudio

**Returns:** Same as transcribeAudio

## Supported Languages

Deepgram Nova-3 supports 100+ languages including:
- Spanish (es)
- English (en)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- And many more...

## Supported Audio Formats

- MP3
- WAV
- FLAC
- OGG
- WebM
- M4A
- AAC
- And more...

## Best Practices

### 1. Recording Duration
- Keep recordings under 5 minutes for best UX
- Longer recordings = longer transcription time
- Consider splitting long recordings

### 2. Audio Quality
- Ensure good microphone quality
- Minimize background noise
- Speak clearly and at moderate pace

### 3. Error Handling
Always handle errors gracefully:

```tsx
<AudioTranscriptionButton
  onTranscript={(text) => {
    if (text.length > 0) {
      form.setValue("field", text);
    } else {
      toast.error("No se detectó audio");
    }
  }}
/>
```

### 4. User Feedback
The component automatically provides:
- Toast notifications for recording start/stop
- Loading spinner during transcription
- Visual feedback (red square when recording)

### 5. Security
- API key is only used server-side
- Never expose `DEEPGRAM_API_KEY` to client
- Audio is processed in-memory, not stored

## Examples

### Example 1: Property Description

```tsx
import { AudioTranscriptionButton } from "~/components/shared/audio-transcription-button";

export function PropertyDescriptionField() {
  const form = useForm();

  return (
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
                // Append to existing text
                const current = field.value ?? "";
                field.onChange(
                  current ? `${current} ${text}` : text
                );
              }}
              language="es"
            />
          </div>
        </FormItem>
      )}
    />
  );
}
```

### Example 2: Contact Notes

```tsx
export function ContactNotesField() {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-2">
      <Label>Notas del contacto</Label>
      <div className="flex items-start gap-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Añadir notas..."
          rows={3}
        />
        <AudioTranscriptionButton
          onTranscript={(text) => {
            setNotes((prev) => prev ? `${prev}\n\n${text}` : text);
          }}
        />
      </div>
    </div>
  );
}
```

### Example 3: Appointment Summary

```tsx
export function AppointmentSummary() {
  const form = useForm();

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label>Resumen de la cita</Label>
        <Input
          {...form.register("summary")}
          placeholder="Resumen..."
        />
      </div>
      <AudioTranscriptionButton
        onTranscript={(text) => form.setValue("summary", text)}
        variant="outline"
        size="default"
      />
    </div>
  );
}
```

## Troubleshooting

### Microphone Access Denied
**Issue:** Browser doesn't allow microphone access
**Solution:**
- Ensure HTTPS is enabled (required for getUserMedia)
- Check browser permissions
- User must grant microphone access

### Low Accuracy
**Issue:** Transcription is inaccurate
**Solution:**
- Check audio quality (background noise)
- Ensure correct language is specified
- Speak clearly and at moderate pace
- Consider using `diarize: true` for multiple speakers

### High Latency
**Issue:** Transcription takes too long
**Solution:**
- This is expected for longer recordings
- Show loading indicator to user
- Consider real-time streaming for instant feedback (requires WebSocket implementation)

### API Key Error
**Issue:** "Invalid API key" or authentication error
**Solution:**
- Verify `DEEPGRAM_API_KEY` is set in `.env`
- Check key is valid at https://console.deepgram.com/
- Ensure no extra spaces in environment variable

## Performance

### Latency Benchmarks
- Recording: Instant (browser native)
- Upload: < 100ms (in-memory Buffer)
- Transcription: ~1-3 seconds (depending on audio length)
- Total: ~2-4 seconds for typical 30-second recording

### Optimization Tips
1. **Reduce audio size**: Use WebM instead of WAV
2. **Set appropriate language**: Don't rely on auto-detection
3. **Enable smart_format**: Reduces post-processing needs
4. **Batch processing**: For multiple files, process in parallel

## Migration from Other Services

### From OpenAI Whisper API
Deepgram Nova-3 offers:
- ✅ 2x faster transcription
- ✅ ~50% lower cost
- ✅ Better Spanish support
- ✅ Native streaming option

**Migration is simple:**
```diff
- import { openai } from "~/lib/openai";
- const result = await openai.audio.transcriptions.create({
-   file: audioFile,
-   model: "whisper-1",
- });
+ import { transcribeAudio } from "~/server/actions/transcription";
+ const result = await transcribeAudio(audioFile, {
+   language: "es",
+ });
```

### From Web Speech API
Deepgram offers:
- ✅ Better accuracy
- ✅ More languages
- ✅ Works in all browsers
- ❌ Requires server processing

## Future Enhancements

Potential improvements to consider:
1. **Real-time streaming** - WebSocket for instant feedback
2. **Speaker diarization** - Identify different speakers
3. **Custom vocabulary** - Add real estate terms
4. **Audio storage** - Save recordings for later review
5. **Batch transcription** - Process multiple files at once

## Resources

- [Deepgram Documentation](https://developers.deepgram.com/)
- [Deepgram Console](https://console.deepgram.com/)
- [Supported Languages](https://developers.deepgram.com/docs/languages)
- [Pricing Calculator](https://deepgram.com/pricing)

## Support

For issues or questions:
1. Check Deepgram status: https://status.deepgram.com/
2. Review API logs in Deepgram Console
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
