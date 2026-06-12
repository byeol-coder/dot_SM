You are a senior accessibility-first React, TypeScript, product UI/UX engineer, and premium visual designer.

Upgrade the existing Vite + React + TypeScript app:
“Touch the K-POP — Live Tactile Cue Sheet Prototype”

This is a second-stage upgrade.
The app already builds and deploys correctly.
Do not break the build.
Do not remove existing features.
Do not change the GitHub Pages base path unless absolutely necessary.

Read these documents first:
- docs/UIUX_UPGRADE_BRIEF.md
- docs/UIUX_CODE_PROMPT.md
- docs/UIUX_ACCESSIBILITY_PREMIUM_V2_PROMPT.md

## Main goal

Make the prototype feel both:

1. Visually premium enough to show to executives, SM Entertainment, museums, schools, accessibility partners, and global K-POP stakeholders.
2. Comfortable and usable for blind and low-vision users, not just visually impressive.

This should not feel like a generic dashboard.
It should feel like a high-end AI accessibility performance interface.

## Core product concept

“Touch the K-POP” should feel like:

An AI-powered live tactile performance control room where K-POP lyrics, choreography, stage effects, rhythm, and audience energy become touchable through Dot Pad.

The product should communicate:
- Premium
- Accessible
- Emotional
- Futuristic
- Reliable
- Live-performance ready
- Dot Pad-native

## Design quality direction

Make the visual interface feel closer to:
- Apple Intelligence-level polish
- Premium cinematic dark UI
- Live concert command center
- AI accessibility lab
- K-POP stage control room
- High-end glassmorphism product demo

Use:
- Deep black / dark navy background
- Aurora gradients using purple, cyan, blue, magenta, and soft pink
- Premium glass panels
- Soft glow accents
- Tactile dot matrix motifs
- Large rounded cards
- Better spacing and visual hierarchy
- Fewer cramped sections
- Bigger, clearer labels
- Smooth interaction states
- Strong active, hover, disabled, and focus states

Avoid:
- Generic SaaS dashboard look
- Flat gray boxes
- Too many borders
- Tiny text
- Dense controls
- Low-contrast descriptions
- Visual-only cue information
- Overly decorative UI that hurts accessibility

## Accessibility-first requirements

The app must not only look accessible.
It must actually be easier for blind and low-vision users.

Implement or improve:

### Screen reader support
- Use semantic HTML landmarks where appropriate: header, main, nav, section.
- Add aria-labels where visual labels are not enough.
- Add aria-current or clear active state to mode navigation.
- Use aria-live for current live cue changes if there is dynamic cue state.
- Do not make screen readers read decorative visual effects.
- Hide decorative glow/dot/aurora elements with aria-hidden="true".

### Keyboard navigation
- Every important control must be reachable by keyboard.
- Focus order should be logical.
- Visible focus ring must be strong and beautiful, not browser-default only.
- Buttons, tabs, mode cards, cue controls, and playback controls need clear focus states.
- Avoid keyboard traps.
- Add skip-to-content link if not present.

### Low-vision usability
- Use strong text contrast on dark backgrounds.
- Increase important text sizes.
- Avoid thin low-contrast labels.
- Use clear card separation.
- Make current cue, next cue, and Dot Pad state easy to identify.
- Do not rely on color only; pair colors with icons, labels, badges, text, or state names.

### Motion and sensory comfort
- Keep animations subtle.
- Respect prefers-reduced-motion.
- Do not use flashing or intense pulsing effects.
- Live status glow should be soft and not distracting.

### Touch and mobile accessibility
- Tap targets should be large enough.
- Important buttons should not be too close together.
- Mobile layout should stack cleanly without horizontal overflow.
- Dot Pad preview should scale safely on small screens.
- Controls should remain readable and tappable.

## Dot Pad preview upgrade

Upgrade DotPadSim to feel like a premium tactile hardware preview.

It should include:
- Clear label: Dot Pad Live Tactile Preview
- Status badge: Connected / Preview / Live Output / Standby if supported
- Better frame styling
- Raised inactive dots
- Glowing active dots
- Subtle tactile texture
- Proper accessible text alternative
- aria-label explaining the current tactile pattern
- No unnecessary heavy rendering

The Dot Pad area should visually communicate:
“This is not just an image. This is touch output.”

## Audience mode upgrade

Audience mode should be calm, emotional, and highly readable.

Make it feel like it is designed for blind or low-vision concert audiences.

Prioritize:
- Large current cue
- Simple explanation of what is being felt through Dot Pad
- Clear current lyric / movement / rhythm / stage effect
- Dot Pad preview
- Live tactile status
- Minimal clutter
- Friendly language
- Strong contrast
- Screen reader-friendly structure

Avoid making Audience mode feel like an operator dashboard.

## Operator mode upgrade

Operator mode should feel like a professional live control surface.

Prioritize:
- Current cue control
- Next cue preview
- Cue launch buttons
- Cue type badges
- Timeline or setlist feeling
- Clear state for live / paused / standby
- Emergency stop or reset style controls if existing
- Disabled state clarity
- Keyboard accessible operation

Operator mode should feel powerful, but not overwhelming.

## Demo mode upgrade

Demo mode should be presentation-friendly.

Prioritize:
- Clear storytelling
- What this prototype demonstrates
- Why tactile cue sheets matter
- How Dot Pad transforms live performance accessibility
- Simple, beautiful cue examples
- Premium executive-demo feeling

## SM Demo mode upgrade

SM Demo should feel most polished and partner-facing.

Prioritize:
- Executive-level visual polish
- Strong narrative for entertainment accessibility
- Premium K-POP showcase feel
- Clear value proposition
- “This could be proposed to SM or a global entertainment partner” feeling

Do not use copyrighted artist images or unauthorized brand assets.

## Global UI components

Improve reusable UI components if helpful:
- Card
- Button
- Badge
- Section header
- Mode navigation item
- Status pill
- Cue card
- Dot Pad shell

Buttons should have:
- Primary / secondary / danger / ghost variants if useful
- Clear disabled state
- Strong focus-visible state
- Large mobile tap area

Cards should have:
- Premium glass feel
- Good internal spacing
- Clear heading hierarchy
- No cramped content

## Responsive layout

Mobile:
- Stack sections cleanly
- Hero first
- Mode navigation clear
- Dot Pad preview scaled
- Controls large
- No horizontal scroll

Tablet/Desktop:
- Use dashboard composition
- Hero + mode navigation + live status
- Dot Pad preview side-by-side with cue dashboard where appropriate
- Better use of whitespace

## Code requirements

Focus on:
- src/App.tsx
- src/apps/Audience.tsx
- src/apps/Operator.tsx
- src/apps/Demo.tsx
- src/apps/SMDemo.tsx
- src/components/DotPadSim.tsx
- src/components/ui.tsx
- src/settings.tsx
- src/styles.css

Technical rules:
- Keep the app lightweight.
- Do not add large dependencies.
- Prefer CSS and existing React structure.
- Do not break routes.
- Do not remove existing data or features.
- Do not leave unused imports.
- Do not leave TypeScript errors.
- Run npm run build.
- Fix all errors until build passes.

## Final quality bar

When a sighted stakeholder opens the site, they should think:
“This looks premium, futuristic, and presentation-ready.”

When a blind or low-vision user uses it, they should feel:
“The structure is clear, the states are understandable, and I am not forced to rely on visuals.”

When an operator uses it, they should feel:
“I can control live tactile cues clearly and safely.”

When an executive sees it, they should feel:
“This is a serious accessibility innovation for live entertainment.”

