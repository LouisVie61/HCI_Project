# Sign recognition model

Place a trained MediaPipe GestureRecognizer model here:

```text
public/models/gesture_recognizer.task
```

The sign recognition page tries this path by default. You can also set
`VITE_GESTURE_MODEL_URL` to load the model from Firebase Storage, S3, or another
public CDN URL with CORS enabled.

If no custom model is available, the app falls back to the local rule-based hand
gesture demo.
