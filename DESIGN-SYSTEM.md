# Design system

Cipher Lab is built on the a11y-charts system: Geist, monochrome ink on white, true black in dark mode. State is shown with ink weight, rules and shape, never a brand color.

## Tokens (`src/styles/tokens.css`)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | #ffffff | #0a0a0a | Page and panel background |
| `--bg-subtle` | #fafafa | #111111 | Bars, badges, hover wash |
| `--bg-hover` | #f2f2f2 | #1a1a1a | Hover and selected rows |
| `--ink` | #171717 | #ededed | Text, primary button, active marks |
| `--ink-soft` | #666666 | #a1a1a1 | Secondary text |
| `--ink-faint` | #737373 | #8a8a8a | Labels, table headers |
| `--rule` | #ebebeb | #242424 | Hairlines |
| `--rule-strong` | #d4d4d4 | #3a3a3a | Control borders, frame edge |
| `--focus` | #0068d6 | #52a8ff | Focus ring only |
| `--on-ink` | #ffffff | #0a0a0a | Text on solid ink |

Type: Geist 400/500/600 for everything; Geist Mono for IDs, addresses, kickers and badges. Body 15px/1.6. Page title 32–44px, weight 600, letter-spacing −0.045em; hero title 44–72px, −0.055em.

Theme follows the OS until the person picks one with the header toggle (stored in `localStorage` as `cl-theme`).

## Components

### BrowserFrame

`src/components/BrowserFrame.tsx` and `src/styles/browser-frame.css`.

A plain browser window for presenting an app inside a page: a product demo, a prototype, a case study. The app inside reads as the product, the page around it as the story.

```tsx
import BrowserFrame, { useFrameHistory } from './components/BrowserFrame';

function Demo() {
  const { pathname, nav, menuOpen, setMenuOpen, scrollRef } = useFrameHistory();
  return (
    <BrowserFrame.Stage>
      <BrowserFrame
        host="cipherlab.app"
        path={pathname}
        nav={nav}
        menu={{ open: menuOpen, onToggle: () => setMenuOpen((o) => !o), controls: 'sidebar' }}
        end={<Avatar />}
      >
        <div className="my-app">…</div>
      </BrowserFrame>
    </BrowserFrame.Stage>
  );
}
```

| Prop | What it does |
| --- | --- |
| `path` | Shown after the host in the address bar |
| `host` | Address host, default `cipherlab.app` |
| `nav` | Back / Forward buttons; `useFrameHistory()` supplies one |
| `menu` | Menu button for small screens; `controls` is the id of the panel it opens |
| `end` | Right end of the bar, such as an avatar |

Rules:

- **Fill the viewport.** `BrowserFrame.Stage` sizes the frame to the height under the site header. The page itself never scrolls; the app's own regions scroll inside the frame.
- **90% on wide screens.** From 1280px up, the frame takes 90% of the width and 90% of the height under the header, centered, so it reads as a framed product with even space around it. Below 1280px it fills the space with a 16px gutter (8px under 520px), because room inside matters more there.
- **Everything stays inside.** Back and Forward only move through pages visited in the frame, so Back never leaves it. Panels opened from the bar (like the small-screen menu) render inside the frame body, which is the positioning context.
- **Keep the bar quiet.** The window dots are decoration and hidden from assistive tech. Back, Forward and Menu are real buttons with names; the address is read-only text.
- **Small screens.** Below 960px the menu button appears; below 520px the dots and host hide so the path keeps its room.

Tunables: `--bframe-gutter` (below 1280px), `--bframe-radius`, `--bframe-bar-h`. The component reads only the shared tokens above, so it drops into any project that uses them.

### Select

`src/components/Select.tsx`, styles under "Select (custom dropdown)" in `src/styles/app.css`.

A custom dropdown that replaces the native `<select>`, following the WAI-ARIA select-only combobox pattern. It matches the other fields: same height, border and radius.

```tsx
import Select from './components/Select';

<Select
  label="Metric"
  value={metric}
  onChange={setMetric}
  options={[
    { value: 'Precision', label: 'Precision' },
    { value: 'Recall', label: 'Recall' },
  ]}
  describedBy="metric-help"
/>
```

| Prop | What it does |
| --- | --- |
| `label` | Visible label; also the accessible name |
| `value`, `onChange` | Controlled value (string or number) |
| `options` | `{ value, label }` list |
| `describedBy` | id of help text that describes the field |
| `inline` | Label beside the button instead of above it |
| `hideLabel` | Keep the label for screen readers only, for compact fields whose context already names them (a status inside a policy match) |
| `className` | Extra classes, e.g. `select--wide` for a 240px minimum |

Rules:

- **Looks like a field, opens like a menu.** Chevron sits 14px from the right edge and flips when open. The list floats 6px below with an 8px radius and soft shadow; the active option has a `--bg-hover` wash, the chosen one is weight 500 with a check.
- **Never clipped.** Near the bottom of its scrolling area (the nearest `[data-scroll]` or `.lab-main`), the list opens upward. Long lists scroll at 280px.
- **Focus stays on the button.** The open list is announced through `aria-activedescendant`, so screen readers hear "Metric, Precision" and each option as you move.
- **Keyboard.** Enter, Space or the arrow keys open it. Up/Down, Home/End and Page Up/Down move. Typing jumps to a matching option. Enter or Space chooses, Escape closes without changing, Tab chooses and moves on.
- **High contrast.** In forced-colors mode the active option gets a system Highlight outline.

### ResetButton

`src/components/ResetButton.tsx`, styles under `.reset` in `src/styles/app.css`.

An icon button for the BrowserFrame bar (`end` slot) that clears saved changes after a confirm. Each app in a frame gets its own, scoped to its own data: the lab's and the vault's resets never touch each other.

```tsx
<ResetButton what="vault" description="…what it clears…" done="Vault reset." to="/vault/all"
  onReset={() => resetStore(isVaultKey)} />
```

Rules: the confirm is a small `alertdialog` under the button; focus starts on **Cancel**; Escape or a click outside closes it and returns focus to the button; the result is announced in a polite live region. Say what is cleared and what is kept.

### HoverCard

`src/components/HoverCard.tsx`, styles under "Hover card" in `src/styles/vault.css`.

Details that appear on hover or keyboard focus. In the Vault: the policy matches and AI predictions on a message row, a prediction chip's model and policies, a classification tag's group and members.

```tsx
import HoverCard from './components/HoverCard';

<HoverCard label="3 policy matches, 2 open" card={<PolicyMatchesCard m={m} r={r} />}>
  <FlagIcon filled /> 2
</HoverCard>
```

| Prop | What it does |
| --- | --- |
| `label` | Accessible name of the trigger button |
| `card` | Card content, text only |
| `children` | What the trigger shows |
| `onClick` | Optional click handler on the trigger |

Rules (WCAG 1.4.13, content on hover or focus):

- **The trigger is a real button** with its own name. The card is linked with `aria-describedby`, so screen readers hear it on focus.
- **Hoverable, dismissable, persistent.** The pointer can move onto the card; Escape closes it; it stays until pointer or focus leaves. Scrolling closes it.
- **Text only.** Never put links or buttons in a card. Actions go in the page.
- **Never clipped.** It renders at the end of `<body>`, positions against the trigger and flips above when there's no room below. The arrow follows the trigger.

## Vault patterns

`src/styles/vault.css`. Built on the same tokens; nothing there overrides the Lab's styles.

- **Message list.** Hairline rows, 42px tall; sticky header with a `--rule-strong` bottom rule. Unread: an 8px ink dot and weight 600 on sender and subject. Open message: `--bg-hover` row with a 3px ink bar on the left, matching the current nav link. Tab reaches one stop per row (the subject); Up and Down move between rows and open them.
- **Narrow lists drop columns** with container queries: recipients first, then size and attachments, then AI predictions and date.
- **Reading pane** below or beside the list (segmented control, remembered). Under 760px one pane shows at a time, with a back link.
- **Lexicon highlight.** Matched phrases are wrapped in `<mark>`: a `--bg-hover` wash with a 2px ink underline, so it reads in both themes without color. In forced-colors mode it uses the system Mark colors.
- **Disclosure, pill, prediction chip.** Collapsible review sections use a full-width button with a chevron and an ink **pill** count. Prediction chips are 30px, 6px radius, `--bg-subtle` with a `--rule-strong` border.
- **Counts in the nav** sit right-aligned in Geist Mono, `--ink-faint`, turning `--ink` on the current view.
