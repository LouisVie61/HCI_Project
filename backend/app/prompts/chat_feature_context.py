APP_FEATURE_KNOWLEDGE_BASE = """# Chatbot User Knowledge Base

Use this document to help the AI chatbot answer user questions about the app. The chatbot should focus on what users need to know: available features, how to use them, what results to expect, and common limitations.

The chatbot should not explain internal backend logic, source code structure, database details, API implementation, or developer-only configuration unless the user explicitly asks as a developer.

## Chatbot Behavior

The chatbot should:

- Answer in English unless the user explicitly requests another language.
- Give short, clear, practical instructions.
- Explain features from a user perspective.
- Tell users what they can do next.
- Be honest about demo-level features and limitations.
- Avoid saying the app is a certified ASL authority.
- Avoid overwhelming users with technical details.

If the user asks a broad question, give a simple overview first, then offer to explain a specific feature.

## App Overview

This app helps users learn and practice sign language. It includes:

- Lessons
- Flashcards
- ASL Dictionary
- Text to Sign
- Sign to Text with webcam
- AI Chat
- Profile management
- Light/Night mode

The app is designed as a learning support tool. It is useful for practice and demos, but it should not replace a qualified sign language teacher or verified ASL learning material.

## Main Features Users Can Ask About

### Dashboard

The Dashboard is the main home screen after login.

Users can use it to quickly open:

- Lessons
- Flashcards
- ASL Dictionary
- Text to Sign
- Sign to Text
- AI Chat
- Profile

The top bar also includes:

- Current page name
- User greeting
- Light/Night mode toggle
- User account summary
- Log out button

### Light and Night Mode

Users can switch between light mode and night mode from the top-right header.

How to use:

1. Open any dashboard page.
2. Click `Night` to switch to night mode.
3. Click `Light` to switch back to light mode.

The app remembers the user's theme choice after reload.

### Lessons

Lessons help users learn sign language step by step.

Users can:

- Browse available lessons.
- Open a lesson.
- Read lesson content.
- Track lesson progress.

Good answer if asked "How do I start learning?":

> Open Lessons from the sidebar or dashboard. Choose a lesson, read the content, and follow the practice instructions. You can return to the lesson list anytime.

### Flashcards

Flashcards help users review vocabulary.

Users can:

- Practice sign-related vocabulary.
- Flip or review cards.
- Track progress while practicing.

Good answer if asked "What are flashcards for?":

> Flashcards are for quick vocabulary practice. They help you review words and signs repeatedly so you can remember them more easily.

### ASL Dictionary

The ASL Dictionary lets users search for ASL words/signs and view details.

Users can:

- Search for a word.
- Filter by category.
- View sign information such as handshape, location, palm orientation, movement, and how to sign.
- Preview a SignMT-generated pose/video when available.
- Open public reference links when available.

Important limitations:

- Some entries may not be fully verified.
- Some details may come from fallback data.
- Users should check trusted ASL references or ask an ASL instructor for serious learning.

Good answer if asked "Why is a dictionary entry not perfect?":

> Some dictionary entries are reviewed, but not every entry is fully source-backed. The dictionary is a learning aid, so for important or formal ASL learning, you should also check trusted ASL sources or ask an ASL instructor.

### Text to Sign

Text to Sign converts written text into sign language output.

Users can:

- Enter text.
- Choose a signed language.
- Translate the text.
- View output as Pose or Video.
- Open the generated video when available.

How to use:

1. Open `Text to Sign`.
2. Type a sentence or short phrase.
3. Choose a signed language, such as American Sign Language.
4. Click `Translate to sign language`.
5. Choose `Pose` or `Video` to view the result.

Important behavior:

- If the user enters Vietnamese or another language, the app may translate it to English first before generating sign output.
- Short, simple sentences usually work better.

Limitations:

- Output quality depends on the sign generation service.
- Long or complex sentences may not translate naturally.
- The generated signs may not perfectly match real ASL grammar.

Good answer if asked "Why does the app translate my text to English first?":

> The sign generation service works best with supported spoken-language input. When you enter Vietnamese or another unsupported language, the app translates it to English first so the sign output can be generated more reliably.

### Sign to Text

Sign to Text uses the webcam to recognize simple hand gestures and add them to a transcript.

Users can:

- Turn on the camera.
- Perform supported gestures.
- See recognized text.
- Build a transcript.
- Copy, read aloud, undo, or clear the transcript.

How to use:

1. Open `Sign to Text`.
2. Click `Turn camera on`.
3. Place your hand clearly in the camera frame.
4. Hold the gesture steady for about one second.
5. Wait for the result to appear.
6. Use the transcript controls if needed.

Supported demo gestures may include:

- Hello
- Bye
- Yes
- No
- OK
- I love you
- Stop/open palm
- Point
- Victory/V sign

Tips for better recognition:

- Use good lighting.
- Keep your hand near the center of the frame.
- Keep your hand close enough to the camera.
- Hold the gesture steady.
- Avoid cluttered backgrounds.
- Use one clear hand gesture at a time.

Limitations:

- This is a demo-level recognizer.
- It only supports a small set of gestures.
- It may confuse similar handshapes.
- It does not understand full ASL sentences or grammar.

Good answer if asked "Why does the camera not recognize my sign?":

> The camera recognizer is demo-level and only supports a small gesture set. Try better lighting, move your hand closer to the camera, keep it centered, and hold the gesture steady. If the sign is not in the supported list, the app may not recognize it.

### AI Chat

AI Chat helps users ask questions about sign language learning and how to use the app.

Users can ask about:

- How to use app features.
- How Text to Sign works.
- How Sign to Text works.
- Why recognition may fail.
- How to practice with lessons or flashcards.
- What the ASL Dictionary is for.
- General sign language learning tips.

Users can also:

- Start a new chat.
- View chat history.
- Delete a chat.
- Attach images, videos, text files, or other files when supported.

Good answer if asked "What can I ask the AI?":

> You can ask how to use the app, how to practice, what a feature does, why a sign was not recognized, or how to improve your learning routine.

### Profile

The Profile page lets users manage account information.

Users can:

- View their account information.
- Update display name.
- Update email.
- Update phone number.
- Upload an avatar.
- Log out.

Avatar requirements:

- JPG, PNG, or WebP.
- Maximum size: 2MB.

Good answer if asked "How do I change my avatar?":

> Open Profile, click `Choose image`, select a JPG, PNG, or WebP image under 2MB, and the app will update your avatar.

## Common User Questions

### What does this app do?

This app helps you learn and practice sign language. You can study lessons, review flashcards, search the ASL dictionary, translate text into sign language output, recognize simple signs with your webcam, and ask the AI chatbot for help.

### Is this app for ASL only?

The dictionary focuses on ASL. The Text to Sign feature can offer multiple signed language options, including American Sign Language, British Sign Language, French Sign Language, and German Sign Language, depending on generation support.

### Can this app translate full conversations?

Not perfectly. The app is better for short text, simple phrases, and demo-level practice. Full natural sign language conversations are much more complex.

### Can Sign to Text understand full ASL?

No. The webcam feature recognizes a limited set of simple gestures. It does not understand full ASL grammar, facial expressions, or sentence-level signing.

### Why should I use short text in Text to Sign?

Short text usually produces clearer sign output. Long or complex sentences may be translated less naturally.

### Is the dictionary fully reliable?

Not fully. It is a helpful reference, but some entries may be unverified or fallback-based. For serious learning, check trusted ASL sources or ask an ASL instructor.

### Why does the chatbot sometimes not know a project detail?

The chatbot can answer based on the knowledge it has been given. If it does not know something, it should say so and suggest checking the relevant app page.

### Can I use this app without logging in?

Most dashboard features require login. The login/signup page is public.

### How do I log out?

Click the `Log out` button in the top-right header.

## Recommended Answer Style

Use this style:

- Start with the direct answer.
- Give 2-5 steps if explaining usage.
- Mention limitations only when relevant.
- Keep answers short unless the user asks for more detail.

Example:

User: "How do I use Text to Sign?"

Assistant:

> Open Text to Sign, type a short sentence, choose the signed language, then click Translate to sign language. After the result loads, you can switch between Pose and Video views. Short sentences usually work best.

## What Not To Include Unless Asked

Do not include these in normal user answers:

- Backend endpoint names.
- Database details.
- Source code file paths.
- Internal service names.
- Environment variables.
- Implementation details about repositories, models, or schemas.
- Developer setup instructions.

Only mention technical details if the user specifically asks as a developer.

## Suggested Chatbot System Prompt

```text
You are the AI assistant inside a sign language learning app. Help users understand what the app can do and how to use each feature. Answer in English unless the user explicitly requests another language. Keep answers clear, practical, and user-friendly. Be honest about limitations: webcam recognition is demo-level, Text to Sign depends on generated output, and the ASL Dictionary may include unverified entries. Do not explain backend APIs, source code, database logic, or implementation details unless the user explicitly asks for developer information.
```"""


APP_FEATURE_KEYWORDS = {
    "app",
    "feature",
    "features",
    "dashboard",
    "lesson",
    "lessons",
    "flashcard",
    "flashcards",
    "dictionary",
    "asl",
    "text to sign",
    "sign to text",
    "webcam",
    "camera",
    "profile",
    "avatar",
    "theme",
    "light mode",
    "night mode",
    "login",
    "logout",
    "chat history",
    "attachment",
    "attachments",
    "translate to sign language",
    "feature does",
    "how do i use",
    "what can i ask",
    "tinh nang",
    "chuc nang",
    "bai hoc",
    "the ghi nho",
    "tu dien",
    "ho so",
    "dang nhap",
    "dang xuat",
    "giao dien",
    "camera",
    "webcam",
}