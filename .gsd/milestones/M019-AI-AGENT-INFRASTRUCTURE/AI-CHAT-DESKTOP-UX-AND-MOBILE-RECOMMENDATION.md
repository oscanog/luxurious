# Luxurious AI Chat UX: Desktop Baseline and Flutter Mobile Recommendation

**Source:** `src/components/ai/AiChatBadge.tsx`  
**Purpose:** Capture desktop Luxurious AI chat behavior and define how Flutter mobile should reach same smooth, crisp feel.

## Desktop UX Baseline

Desktop chat lives as a floating AI badge in the bottom-right corner of every admin layout screen.

When closed, user sees a 64px rounded square button with a gradient background, message icon, glow, shadow, and slight hover lift. It feels like a premium persistent assistant, not a normal form button.

When opened, the badge becomes a compact chat panel:

- Fixed position, bottom-right.
- Max height: `min(680px, viewport - 7rem)`.
- Max width: `min(420px, viewport - 2rem)`.
- Rounded 32px shell.
- Subtle border, translucent card background, heavy soft shadow, backdrop blur.
- Header contains Sparkles icon, "Luxurious AI", model label, and close button.

## Message Flow

User submits from a textarea composer. Enter sends. Shift+Enter inserts newline.

On submit:

1. Input trims message.
2. Empty input and duplicate sends are blocked.
3. Textarea clears immediately.
4. User bubble appears immediately before server response.
5. `isSending` turns on.
6. Convex action `api.aiAgent.sendMessage` runs.
7. Assistant response is appended after action completes.
8. List auto-scrolls smoothly to bottom.

Important: desktop currently does **not** stream tokens from Convex/DeepSeek. It waits for full server response, then uses client-side typewriter reveal for the newest assistant message.

## Assistant Typing Illusion

Desktop has two separate motion states.

### While Waiting For Server

Before response arrives, chat shows a composing bubble with bot icon and rotating status text:

- "Reading workspace context"
- "Checking enabled skills"
- "Drafting concise answer"
- "Polishing response"

Phrase changes every 1200ms. A small pulsing vertical caret appears beside text.

### After Response Arrives

Newest assistant message reveals with typewriter animation:

- Timer interval: 22ms.
- Reveal step grows by `ceil((remaining text length) / 42)`.
- Long replies reveal faster than one literal character at a time.
- Small pulsing cursor shows until full text is displayed.
- Older assistant messages render instantly.

This creates ChatGPT-like live response feel without true token streaming.

## Visual Language

Desktop chat uses strong role separation:

- User bubble: right aligned, primary color, white text, 24px radius, strong font weight.
- Assistant bubble: left aligned, bot icon avatar, card surface, border, 24px radius, normal readable text.
- Assistant text preserves whitespace and line breaks.
- Model name appears below assistant response in small uppercase label when available.
- Error message appears as compact red tinted banner above composer.

Motion and polish come from:

- Smooth scroll to latest message.
- Immediate optimistic user bubble.
- Rotating composing status.
- Typewriter reveal.
- Pulsing caret.
- Gradient bot avatar.
- Translucent shell and backdrop blur.

## Keyboard UX

Desktop composer behavior:

- Textarea is always focused by user interaction.
- Enter sends.
- Shift+Enter newline.
- Send button disabled when input is empty, sending, or AI disabled.
- Textarea disabled while sending.
- Placeholder changes when DeepSeek key missing.

This is a key part of the "crispy" feel: user types, hits Enter, sees message instantly, then sees assistant thinking and revealing.

## Backend Contract

Desktop depends on:

- Query: `api.aiSettings.getPublicSettings`
- Action: `api.aiAgent.sendMessage`

Action returns:

- `threadId`
- `content`
- `model`

Desktop state is local for current panel session. It does not subscribe to message stream for token-by-token updates.

## Flutter Mobile Recommendation

Flutter mobile should copy desktop UX in phases.

## Phase A: Match Desktop Feel Without Backend Streaming

This is fastest and lowest risk. Use same Convex action and add client-side typewriter.

Mobile behavior:

1. User taps AI Chat from FAB speed dial.
2. Full-screen `AiChatScreen` opens.
3. Input stays docked above keyboard.
4. Sending immediately appends user bubble.
5. Clear input immediately.
6. Show composing bubble with rotating desktop phrases.
7. Call `aiAgent:sendMessage`.
8. When full response returns, append assistant bubble with typewriter reveal.
9. Auto-scroll during composing and reveal.

Implementation notes:

- Add `displayContent` or per-message reveal state to Flutter message model.
- Use `Timer.periodic(const Duration(milliseconds: 22))`.
- Reveal step should match desktop: `max(1, ((text.length - index) / 42).ceil())`.
- Animate latest assistant only.
- Show pulsing caret until reveal completes.
- Keep older assistant messages fully rendered.
- Use `ScrollController.animateTo` after each reveal tick or debounce every few ticks.

Recommended Flutter widgets:

- `AnimatedSwitcher` for empty state -> list.
- `AnimatedOpacity` for composing bubble.
- `Timer.periodic` for composing phrase and typewriter.
- `TextField` with `textInputAction: TextInputAction.send`.
- `onSubmitted` sends when single-line intent is clear.
- Icon send button mirrors desktop disabled states.

## Phase B: Improve Mobile Composer

Mobile cannot fully copy desktop keyboard behavior because mobile Enter often means newline or IME action. Use mobile-native mapping:

- Send button is primary path.
- Keyboard send action submits.
- Multi-line input grows up to 5 lines.
- Disable send while response pending.
- Keep input visible with `SafeArea` and keyboard inset padding.
- After send, unfocus only if keyboard blocks reading; otherwise keep focus for rapid follow-up.

Recommended micro-interactions:

- User bubble inserts immediately.
- Send button briefly scales or changes opacity on tap.
- Composer border highlights while focused.
- Empty input send disabled.
- AI disabled/missing key shows banner above chat, not modal.

## Phase C: True Streaming Later

If boss expects real token streaming from network, backend needs new streaming route.

Current Convex action returns full response only. For true streaming:

- Add HTTP streaming endpoint in `convex/http.ts`, likely `POST /mobile/ai/stream`.
- Endpoint authenticates mobile token.
- Endpoint calls DeepSeek with `stream: true`.
- Server returns SSE or newline-delimited JSON chunks.
- Flutter reads streamed response through `http.Client.send`.
- UI appends chunks as they arrive.
- Persist final assistant message after stream completes.

Tradeoff:

- Client typewriter: quick, stable, same perceived UX for most replies.
- True streaming: most realistic ChatGPT feel, more backend work, more failure states, needs persistence design.

Recommendation: ship Phase A first. It matches desktop because desktop already uses client typewriter, not true streaming. Plan Phase C only if product explicitly needs real token arrival from DeepSeek.

## Mobile Acceptance Criteria

- User message appears instantly after send.
- Composing bubble appears within 100ms.
- Composing text rotates every 1200ms.
- Assistant reply reveals progressively, not all at once.
- Latest assistant bubble shows pulsing caret while revealing.
- Chat scroll follows new content smoothly.
- Send disabled while pending.
- Missing API key and disabled assistant states are visible and recoverable.
- Dark/light theme matches Luxurious Blue/Gold/Navy system.
- No keyboard overflow on small Android screens.

## UX Detail To Preserve

The desktop magic is not only "typing letters." It is the whole sequence:

instant user message -> contextual thinking text -> assistant avatar -> progressive reveal -> smooth scroll -> clean composer reset.

Flutter should reproduce this sequence exactly before attempting more backend complexity.
