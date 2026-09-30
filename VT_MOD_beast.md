React <ViewTransition> is the React wrapper around the native View Transitions API.

It renders nothing to the DOM - it just tells React: "when this part of the UI updates inside a Transition, animate it with document.startViewTransition() for me."

Available as:

```btsx
import { ViewTransition, unstable_ViewTransition as ViewTransition } from "octane";
```

Install if you don't have it:

bash

npm i react@latest react-dom@latest

# if still not available:

# npm i react@canary react-dom@canary

Golden rule: No startTransition = No animation. <ViewTransition> only animates updates wrapped in startTransition, useTransition, useActionState, useOptimistic, or Suspense reveals.

```btsx

import { startTransition } from "octane";
module
  startTransition(() => {
    setTab("about"); // <- this will animate ViewTransitions inside
  });


```

CSS Primer You Need
React sets view-transition-name for you from the name prop. You style with:

```css
::view-transition {
  background: #fff;
}
::view-transition-group(header) {
  animation-duration: 400ms;
}
::view-transition-old(header) {
  animation: ...;
}
::view-transition-new(header) {
  animation: ...;
}
::view-transition-image-pair(header) {
  isolation: isolate;
}
```

React also gives you built-in animations: auto, none, fade, slide, expand, collapse. Or define your own variant name and style ::view-transition-group(\*.my-variant).

Props cheat sheet:

```btsx
ViewTransition(
  ~ name='unique-id' // view-transition-name, enables MAGIC MOVE sharing
  ~ enter='fade' // mount animation: auto | none | fade | slide | expand | custom
  ~ exit='fade' // unmount animation
  ~ update='auto' // same component, content/size changed
  ~ share='auto' // different component, same name -> shared element morph
  ~ default='auto' // fallback for enter/exit/update/share
  ~ group='auto' // true | false | "isolated" - animate children together?
  ~ types={['forwards']} // active-view-transition-type() for conditional CSS
  ~ )
```

Always add this:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

1. Basic Update: Text Morph
   The simplest use. Same element updates.

```btsx

import { useState, startTransition, ViewTransition } from "octane";

setup const [count, setCount] = useState(0);
fragment
  ViewTransition(name="count" update="auto")
    h1(style={{ viewTransitionName: "count" }}) #{count}
  button(onClick={() => startTransition(() => setCount(c => c + 1))}) Increment

```

Actually you don't need style viewTransitionName, name="count" does it. Use update="none" to disable:

```btsx
ViewTransition(name="count" update="none")
```

CSS to customize:

```css
::view-transition-old(count),
::view-transition-new(count) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
::view-transition-old(count) {
  animation-name: slide-out-up;
}
::view-transition-new(count) {
  animation-name: slide-in-up;
}
​ @keyframes slide-out-up {
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}
@keyframes slide-in-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
}
```

Guide: Use name for anything that should morph instead of cross-fade. Name must be unique on screen at once.

2. Tabs with Shared Underline - share
   Classic layout animation without Framer-Motion.

```btsx

import { useState, useTransition, ViewTransition } from "octane";
module
  const TABS = ["Home", "About", "Team"];

setup
  const [tab, setTab] = useState("Home");
  const [isPending, start] = useTransition();
div
  div(style={{ display: "flex", gap: 16 }})
    each t in TABS key t
      button(onClick={() => start(() => setTab(t))})
        | #{t}
        if tab === t
          ViewTransition(name="tab-underline" share="auto")
            .underline
  | ​
  ViewTransition(name={`panel-${tab}`} update="fade" key={tab})
    div(key={tab}) Content for #{tab}

```

```css
.underline {
  height: 2px;
  background: blue;
}
::view-transition-group(tab-underline) {
  animation-duration: 350ms;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Guide: share fires when different <ViewTransition name="same"> unmounts in one place and mounts in another in the same transition. That's what slides the underline. Don't use same name for two visible elements at once.

3. Expandable Card - Magic Move
   Shared element between list and detail.

```btsx

import { useState, startTransition, ViewTransition } from "octane";
component Card
  if selected
    ViewTransition(name={`card-${id}`} share="expand")
      div(className="card expanded" onClick={() => startTransition(() => onSelect(null))})
        ViewTransition(name={`title-${id}`})
          h2 Card #{id} - Expanded with lots of text...
        p Details, image, actions...
  else
    ViewTransition(name={`card-${id}`} share="expand")
      .card(onClick={() => startTransition(() => onSelect(id))})
        ViewTransition(name={`title-${id}`})
          h2 Card #{id}
component Grid
  setup const [sel, setSel] = useState(null);
  .grid
    each id in [1, 2, 3] key id
      Card(id={id} selected={sel === id} onSelect={setSel})
```

```css

.card { contain: layout; }
::view-transition-group(*.expand) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
Guide - Moderate: Nest ViewTransitions. Outer card-${id} morphs container size, inner title-${id} morphs text position independently. Add contain: layout to avoid layout thrash.

```

4. Image Gallery -> Lightbox

```btsx

import { startTransition, useState, ViewTransition } from "octane";

setup const [active, setActive] = useState(null);
fragment
  .thumbs
    each img in images key img.id
      ViewTransition(name={`img-${img.id}`} share="auto" exit="fade" enter="fade")
        img(src={img.thumb} onClick={() => startTransition(() => setActive(img))})
  | ​
  if active
    .lightbox(onClick={() => startTransition(() => setActive(null))})
      ViewTransition(name={`img-${active.id}`} share="auto" enter="expand")
        img.large(src={active.full})
      ViewTransition(enter="slide" exit="fade")
        p #{active.caption}
```

```css
::view-transition-old(img-*),
::view-transition-new(img-*) {
  object-fit: cover;
  border-radius: 12px;
}
```

Guide: For images always set same aspect-ratio / object-fit on thumb and large to prevent stretch during morph. Thumbs need exit="fade" otherwise grid jumps.

5. Filterable List with Enter / Exit
   This is where React beats raw API - exit animations are automatic via key.

```btsx

import { startTransition, useState, ViewTransition } from "octane";

setup
  const [q, setQ] = useState("");
  const filtered = items.filter(i => i.includes(q));
fragment
  input(
    ~ value={q}
    ~ onInput={e => {
    ~ const v = e.target.value;
    ~ startTransition(() => setQ(v));
    ~ }}
    ~ )
  ul
    ViewTransition(group enter="expand" exit="collapse" default="none")
      each item in filtered key item
        ViewTransition(name={`item-${item}`} enter="slide" exit="fade" update="slide")
          li #{item}
```

```css
/* Custom slide + fade combos */
::view-transition-group(*.slide) {
  animation-duration: 300ms;
}
::view-transition-old(*.slide) {
  animation-name: fade-out;
}
::view-transition-new(*.slide) {
  animation-name: slide-in;
}
​ @keyframes slide-in {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
}
@keyframes fade-out {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

Guide: Wrap list in parent <ViewTransition group> to animate container height together, otherwise scrollbar jumps. Use stable key + stable name. default="none" on parent prevents double animation.

6. SPA Route Transitions with Back/Forwards Direction
   Advanced: use types for directional slide.

```btsx

import { ViewTransition, useTransition, useState } from "octane";

setup
  const [route, setRoute] = useState({ page: "home", dir: "forwards" });
  const [, start] = useTransition();
  const nav = (page, dir) => start(() => setRoute({ page, dir }));
fragment
  nav
    button(onClick={() => nav("home", "backwards")}) Home
    button(onClick={() => nav("about", "forwards")}) About
  | ​
  ViewTransition(key={route.page} name="page" enter="slide" exit="slide" types={[route.dir]})
    main(key={route.page})
      if route.page === "home"
        Home
      else
        About

```

```css

/* forwards: slide left, backwards: slide right */
html:active-view-transition-type(forwards) {
  &::view-transition-old(page) { animation-name: slide-out-left; }
  &::view-transition-new(page) { animation-name: slide-in-right; }
}
html:active-view-transition-type(backwards) {
  &::view-transition-old(page) { animation-name: slide-out-right; }
  &::view-transition-new(page) { animation-name: slide-in-left; }
}
​
@keyframes slide-in-right { from { transform: translateX(100%); } }
@keyframes slide-out-left { to { transform: translateX(-30%); opacity: 0; } }
@keyframes slide-in-left { from { transform: translateX(-100%); } }
@keyframes slide-out-right { to { transform: translateX(30%); opacity: 0; } }
Guide: Imperative alternative inside transition:

```

```btsx

import { addTransitionType } from "octane";
module
  startTransition(() => {
    addTransitionType("forwards");
    setPage("about");
  });

```

7. Fully Custom Enter/Exit Choreography
   Define your own variant string, style it.

```btsx

component ViewTransitionComponent
  ViewTransition(enter="my-pop" exit="my-pop" share="my-pop")
    div Pop!
```

```css
::view-transition-group(*.my-pop) {
  animation-duration: 450ms;
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); /* springy */
}
::view-transition-new(*.my-pop) {
  animation-name: pop-in;
}
::view-transition-old(*.my-pop) {
  animation-name: pop-out;
}
​ @keyframes pop-in {
  from {
    transform: scale(0.8) translateY(20px);
    opacity: 0;
  }
}
@keyframes pop-out {
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}
```

Guide: Prefix with _ means "any name with this variant class": ::view-transition-group(_.my-pop). Without \*, it matches name: ::view-transition-group(my-name).

8. Async Suspense Profile Switcher
   ViewTransitions wait for Suspense.

```btsx

import { Suspense, useState, useTransition, ViewTransition } from "octane";

setup
  const [userId, setUserId] = useState(1);
  const [isPending, start] = useTransition();
div(style={{ opacity: isPending ? 0.7 : 1 }})
  button(onClick={() => start(() => setUserId(1))}) User 1
  button(onClick={() => start(() => setUserId(2))}) User 2
  | ​
  ViewTransition(name="profile-card" update="slide" share="slide")
    try
      ProfileCard(id={userId})
    pending
      Skeleton

```

React holds old snapshot until ProfileCard resolves, then morphs. No flicker.

Guide: Put <ViewTransition> outside <Suspense>. If inside, fallback replaces it and you lose shared animation.

9. Dark Mode Circular Reveal - THE Advanced Demo

```btsx

import { startTransition, addTransitionType, ViewTransition } from "octane";
module
  function toggleTheme(isDark, setIsDark, e) {
    const x = e.clientX, y = e.clientY;
    document.documentElement.style.setProperty("--reveal-x", `${x}px`);
    document.documentElement.style.setProperty("--reveal-y", `${y}px`);
    startTransition(() => {
      addTransitionType("theme-reveal");
      setIsDark(!isDark);
      document.documentElement.classList.toggle("dark");
    });
  }
```

Wrap root:

```btsx
component ViewTransitionComponent
  ViewTransition(name="root" update="none" types={["theme-reveal"]})
    App
```

```css
:root {
  --reveal-x: 50vw;
  --reveal-y: 50vh;
}
​ html:active-view-transition-type(theme-reveal) {
  &::view-transition-old(root),
  &::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }
  &::view-transition-new(root) {
    clip-path: circle(0px at var(--reveal-x) var(--reveal-y));
    animation: reveal 600ms ease-out forwards;
    z-index: 1;
  }
  &::view-transition-old(root) {
    z-index: -1;
  }
}
​ @keyframes reveal {
  to {
    clip-path: circle(150vmax at var(--reveal-x) var(--reveal-y));
  }
}
```

Guide: addTransitionType must be called synchronously inside startTransition. types prop is declarative equivalent. This pattern also works for likes, expanding search bar, etc.

10. Multi-Step Wizard Slide

```btsx

import { useState, startTransition, ViewTransition } from "octane";

setup
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState("next");

  const go = (d) => startTransition(() => {
    setDir(d > 0 ? "next" : "prev");
    setStep(s => s + d);
  });
ViewTransition(name="wizard" group types={[dir]} enter="slide" exit="slide")
  .step(key={step})
    h2 Step #{step + 1}
    button(onClick={() => go(-1)} disabled={step === 0}) Back
    button(onClick={() => go(1)}) Next
```

```css
html:active-view-transition-type(next)::view-transition-new(wizard) {
  animation-name: from-right;
}
html:active-view-transition-type(prev)::view-transition-new(wizard) {
  animation-name: from-left;
}
```

Combine with progress bar that has its own name="progress" + update="auto" to morph width.

11. Nested Dashboard - Isolate Sidebar vs Content

```btsx

ViewTransition(name="layout" group={false} default="none")
  div.layout
  ViewTransition(name="sidebar" update="auto")
    aside
      if  collapsed
        Icons
      else
        FullMenu
  ​
  ViewTransition(name="content" update="fade" enter="fade")
    main(key={route}) ...
```

Setting group={false} / default="none" on outer prevents whole layout cross-fading when only sidebar collapses. Children animate independently.

Guide: Default group is auto-grouping. For complex layouts, explicitly disable outer grouping and let inner ViewTransitions own their animation. Otherwise you get huge screenshot morphs.

12. Interruptible + Reduced Motion Guard
    ViewTransitions are interruptible by default in React - spamming tabs/buttons just re-takes snapshot. But long lists can jank.

Best practices:

```btsx

// 1. Disable for large updates
ViewTransition(enter={items.length > 100 ? 'none' : 'fade'} exit="none")
  ...
​
// 2. Respect motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
​
// 3. contain + content-visibility
.list-item {
  contain: layout paint;
  view-transition-name: match-element; /* fallback if not using React name */
}
```

Debug in Chrome DevTools -> Animations -> View Transitions, or slow down:

```css
::view-transition-group(*) {
  animation-duration: 2s !important;
}
```

Checklist for Production
Unique names: never render two visible name="hero" at once. Use id: name={\hero-${id}`}`.
Stable keys: key controls enter/exit. name controls sharing.
share vs update: update = same component instance changed. share = old unmounted, new mounted with same name.
Don't animate everything: wrap page in default="none" then opt-in inner elements.
Images/video: set object-fit: cover on old/new pseudo to avoid squish.
z-index: ::view-transition { z-index: 1000 } to sit above modals if needed.
Fallback is free: unsupported browsers just swap instantly, no code needed.
