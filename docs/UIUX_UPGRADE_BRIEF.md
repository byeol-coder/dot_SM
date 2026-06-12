# UI/UX Upgrade Brief
## Touch the K-POP — Live Tactile Cue Sheet Prototype

The current site works and deploys correctly, but the UI/UX still feels too basic. Upgrade it into a polished, premium, cinematic accessibility prototype that feels presentation-ready for executives, entertainment partners, accessibility organizations, museums, schools, and global K-POP stakeholders.

## Product positioning

This is not a normal dashboard.

Position the product as:

“An AI-powered live tactile performance interface where music, choreography, lyrics, stage effects, and fan energy become touchable through Dot Pad.”

The experience should feel like:
- Apple Intelligence-style premium AI interface
- Dark cinematic concert control room
- Futuristic accessibility lab
- K-POP live performance command center
- High-end product demo, not a rough prototype

## Visual direction

Use a premium dark interface:
- Deep navy / black background
- Purple, cyan, blue, and pink aurora gradients
- Glassmorphism cards
- Soft glow effects
- Dot matrix / tactile pin motifs
- Large rounded panels
- Clear hierarchy
- Elegant spacing
- Premium typography
- Smooth hover / focus / active states

Avoid:
- Plain admin dashboard look
- Flat gray cards
- Too many borders
- Dense tables
- Tiny buttons
- Low contrast text
- Generic SaaS UI

## Global layout

The app should have:
1. A strong hero area explaining what the prototype does
2. Clear mode navigation for Audience / Operator / Demo / SM Demo
3. A live performance status area
4. A Dot Pad tactile preview area
5. Cue cards that feel like live stage signals
6. Mobile-friendly stacked layout
7. Desktop layout with strong dashboard composition

## Hero section

Create a cinematic hero section with:
- Product title
- Short subtitle
- Live status badge
- K-POP / Dot Pad / Accessibility keywords
- Optional visual motif using tactile dots, waveforms, or cue timeline
- Clear call-to-action style navigation buttons

Suggested title:
“Touch the K-POP”

Suggested subtitle:
“Live tactile cue sheets for lyrics, choreography, stage effects, and audience energy.”

## Navigation

Improve navigation so users immediately understand each mode.

Modes:
- Audience Mode: for blind or low-vision concert audiences
- Operator Mode: for staff controlling tactile cues
- Demo Mode: for general prototype demonstration
- SM Demo: for SM Entertainment-style showcase

Each navigation item should include:
- Clear label
- Short description
- Active state
- Hover state
- Keyboard focus state

## Live cue dashboard

Make the live cue dashboard feel like a performance control room.

Include visual emphasis for:
- Current cue
- Next cue
- Cue type
- Cue timing
- Intensity
- Dot Pad output state
- Live / paused / standby status

Cue cards should feel tactile and cinematic:
- Lyrics cue
- Choreography cue
- Beat / rhythm cue
- Stage light cue
- Fan chant cue
- Safety / guide cue

## Dot Pad preview

Upgrade DotPadSim visually.

It should feel like a real tactile display preview:
- 60 × 40 style dot matrix feeling if currently supported
- Raised / inactive dot styling
- Soft glow for active pins
- Clear frame around Dot Pad
- Label and status area
- Optional “Connected”, “Preview”, “Live Output” state
- Good mobile scaling

Do not make the Dot Pad preview too heavy or slow.

## Operator mode

Operator mode should feel powerful and easy to use.

Improve:
- Cue launch controls
- Current cue display
- Upcoming cue list
- Stage status
- Emergency / pause / reset style controls if already present
- Button hierarchy
- Confirmation and disabled states
- Keyboard accessibility

Operator controls should look premium but remain practical.

## Audience mode

Audience mode should be simpler and more emotional.

It should show:
- What the audience is feeling through touch right now
- Current lyric / movement / beat cue
- Dot Pad preview
- Simple status such as “Live tactile cue active”
- Large readable text
- Strong contrast
- Minimal clutter

Audience mode should feel welcoming, not technical.

## SM Demo mode

SM Demo should feel more executive and showcase-ready.

Use language and visuals appropriate for:
- Entertainment partner demo
- K-POP concert accessibility proposal
- Premium branded showcase
- Future service vision

Avoid using copyrighted artist imagery or brand assets unless already present in the project.

## Accessibility requirements

Improve accessibility throughout:
- Visible keyboard focus states
- Strong contrast
- Semantic buttons and landmarks
- aria-label where useful
- aria-live for live cue changes if applicable
- Clear active states
- Do not rely on color only
- Large tap targets on mobile
- Avoid motion that could be distracting
- Keep text readable on dark backgrounds

## Responsive behavior

Mobile-first:
- Hero stacks cleanly
- Navigation becomes card/grid or horizontal scroll if needed
- Dot Pad preview scales down safely
- Controls remain large enough to tap
- No horizontal overflow
- Important controls remain visible

Desktop:
- Use dashboard layout
- Hero + status cards
- Dot Pad preview and cue list side-by-side where appropriate

## Technical constraints

- Keep the app lightweight.
- Use existing components where possible.
- Do not introduce unnecessary libraries.
- Do not break existing routes.
- Do not change Vite base path unless required.
- Do not remove existing features.
- Build must pass with npm run build.
- Remove unused imports.
- Avoid TypeScript errors.
- Keep code readable and maintainable.

## Final quality bar

When someone opens the site, they should immediately feel:

“This is premium.”
“This is innovative.”
“This is accessibility-forward.”
“This could be shown to SM, partners, executives, museums, schools, and global accessibility organizations.”

