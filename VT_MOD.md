React <ViewTransition> is the React wrapper around the native View Transitions API.

It renders nothing to the DOM - it just tells React: "when this part of the UI updates inside a Transition, animate it with document.startViewTransition() for me."

Available as:

```jsx

// React 19.2+ stable
import { ViewTransition } from 'react';
​
// React 19 canary / experimental (older)
import { unstable_ViewTransition as ViewTransition } from 'react';
```

Install if you don't have it:

bash

npm i react@latest react-dom@latest

# if still not available:

# npm i react@canary react-dom@canary

Golden rule: No startTransition = No animation. <ViewTransition> only animates updates wrapped in startTransition, useTransition, useActionState, useOptimistic, or Suspense reveals.

```jsx

import { startTransition } from 'react';
​
startTransition(() => {
  setTab('about'); // <- this will animate ViewTransitions inside
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

````tsx

<ViewTransition
  name="unique-id"      // view-transition-name, enables MAGIC MOVE sharing
  enter="fade"          // mount animation: auto | none | fade | slide | expand | custom
  exit="fade"           // unmount animation
  update="auto"         // same component, content/size changed
  share="auto"          // different component, same name -> shared element morph
  default="auto"        // fallback for enter/exit/update/share
  group="auto"          // true | false | "isolated" - animate children together?
  ```types={['forwards']}  // active-view-transition-type() for conditional CSS
>
````

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

```jsx

import { useState, startTransition, ViewTransition } from 'react';
​
export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <ViewTransition name="count" update="auto">
        <h1 style={{viewTransitionName: 'count'}}>{count}</h1>
      </ViewTransition>
      <button onClick={() => startTransition(() => setCount(c => c+1))}>
        Increment
      </button>
    </>
  );
}
```

Actually you don't need style viewTransitionName, name="count" does it. Use update="none" to disable:

```jsx

<ViewTransition name="count" update="none">
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

```jsx

import { useState, useTransition, ViewTransition } from 'react';
​
const TABS = ['Home', 'About', 'Team'];
​
export function Tabs() {
  const [tab, setTab] = useState('Home');
  const [isPending, start] = useTransition();
​
  return (
    <div>
      <div style={{display:'flex', gap: 16}}>
        {TABS.map(t => (
          <button key={t} onClick={() => start(() => setTab(t))}>
            {t}
            {tab === t && (
              <ViewTransition name="tab-underline" share="auto">
                <div className="underline" />
              </ViewTransition>
            )}
          </button>
        ))}
      </div>
​
      <ViewTransition name={`panel-${tab}`} update="fade" key={tab}>
        <div key={tab}>Content for {tab}</div>
      </ViewTransition>
    </div>
  );
}
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

```jsx

import { useState, startTransition, ViewTransition } from 'react';
​
function Card({ id, selected, onSelect }) {
  if (selected) {
    return (
      <ViewTransition name={`card-${id}`} share="expand">
        <div className="card expanded" onClick={() => startTransition(() => onSelect(null))}>
          <ViewTransition name={`title-${id}`}>
            <h2>Card {id} - Expanded with lots of text...</h2>
          </ViewTransition>
          <p>Details, image, actions...</p>
        </div>
      </ViewTransition>
    );
  }
  return (
    <ViewTransition name={`card-${id}`} share="expand">
      <div className="card" onClick={() => startTransition(() => onSelect(id))}>
        <ViewTransition name={`title-${id}`}>
          <h2>Card {id}</h2>
        </ViewTransition>
      </div>
    </ViewTransition>
  );
}
​
export function Grid() {
  const [sel, setSel] = useState(null);
  return (
    <div className="grid">
      {[1,2,3].map(id => <Card key={id} id={id} selected={sel===id} onSelect={setSel} />)}
    </div>
  );
}
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

```jsx

import { startTransition, useState, ViewTransition } from 'react';
​
export function Gallery({ images }) {
  const [active, setActive] = useState(null);
  return (
    <>
      <div className="thumbs">
        {images.map(img => (
          <ViewTransition key={img.id} name={`img-${img.id}`} share="auto" exit="fade" enter="fade">
            <img src={img.thumb} onClick={() => startTransition(()=>setActive(img))} />
          </ViewTransition>
        ))}
      </div>
​
      {active && (
        <div className="lightbox" onClick={()=>startTransition(()=>setActive(null))}>
          <ViewTransition name={`img-${active.id}`} share="auto" enter="expand">
            <img src={active.full} className="large" />
          </ViewTransition>
          <ViewTransition enter="slide" exit="fade">
            <p>{active.caption}</p>
          </ViewTransition>
        </div>
      )}
    </>
  );
}
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

```jsx

import { startTransition, useState, ViewTransition } from 'react';
​
export function FilterList({ items }) {
  const [q, setQ] = useState('');
  const filtered = items.filter(i => i.includes(q));
​
  return (
    <>
      <input value={q} onChange={e => {
        const v = e.target.value;
        startTransition(()=>setQ(v));
      }} />
      <ul>
        <ViewTransition group enter="expand" exit="collapse" default="none">
          {filtered.map(item => (
            <ViewTransition key={item} name={`item-${item}`} enter="slide" exit="fade" update="slide">
              <li>{item}</li>
            </ViewTransition>
          ))}
        </ViewTransition>
      </ul>
    </>
  );
}
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

```jsx

import { ViewTransition, useTransition } from 'react';
import { useState } from 'react';
​
export function Router() {
  const [route, setRoute] = useState({ page: 'home', dir: 'forwards' });
  const [, start] = useTransition();
​
  const nav = (page, dir) => start(() => setRoute({ page, dir }));
​
  return (
    <>
      <nav>
        <button onClick={()=>nav('home','backwards')}>Home</button>
        <button onClick={()=>nav('about','forwards')}>About</button>
      </nav>
​
      <ViewTransition
        key={route.page}
        name="page"
        enter="slide"
        exit="slide"
        types={[route.dir]} // <- becomes :active-view-transition-type(forwards)
      >
        <main key={route.page}>
          {route.page === 'home' ? <Home/> : <About/>}
        </main>
      </ViewTransition>
    </>
  );
}

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

```jsx
import { addTransitionType } from 'react'
startTransition(() => {
  addTransitionType('forwards')
  setPage('about')
})
```

7. Fully Custom Enter/Exit Choreography
   Define your own variant string, style it.

```jsx
<ViewTransition enter='my-pop' exit='my-pop' share='my-pop'>
  <div>Pop!</div>
</ViewTransition>
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

```jsx

import { Suspense, useState, useTransition, ViewTransition } from 'react';
​
export function ProfileApp() {
  const [userId, setUserId] = useState(1);
  const [isPending, start] = useTransition();
​
  return (
    <div style={{opacity: isPending ? 0.7 : 1}}>
      <button onClick={()=>start(()=>setUserId(1))}>User 1</button>
      <button onClick={()=>start(()=>setUserId(2))}>User 2</button>
​
      <ViewTransition name="profile-card" update="slide" share="slide">
        <Suspense fallback={<Skeleton/>}>
          <ProfileCard id={userId} />
        </Suspense>
      </ViewTransition>
    </div>
  );
}
```

React holds old snapshot until ProfileCard resolves, then morphs. No flicker.

Guide: Put <ViewTransition> outside <Suspense>. If inside, fallback replaces it and you lose shared animation.

9. Dark Mode Circular Reveal - THE Advanced Demo

```jsx

import { startTransition, addTransitionType, ViewTransition } from 'react';
​
function toggleTheme(isDark, setIsDark, e) {
  const x = e.clientX, y = e.clientY;
  document.documentElement.style.setProperty('--reveal-x', `${x}px`);
  document.documentElement.style.setProperty('--reveal-y', `${y}px`);
​
  startTransition(() => {
    addTransitionType('theme-reveal');
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  });
}
​
// Wrap root:
<ViewTransition name="root" update="none" types={['theme-reveal']}>
  <App />
</ViewTransition>
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

```jsx

import { useState, startTransition, ViewTransition } from 'react';
​
export function Wizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState('next');
​
  const go = (d) => startTransition(() => {
    setDir(d > 0 ? 'next' : 'prev');
    setStep(s => s + d);
  });
​
  return (
    <ViewTransition name="wizard" group types={[dir]} enter="slide" exit="slide">
      <div key={step} className="step">
        <h2>Step {step+1}</h2>
        <button onClick={()=>go(-1)} disabled={step===0}>Back</button>
        <button onClick={()=>go(1)}>Next</button>
      </div>
    </ViewTransition>
  );
}

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

```jsx
<ViewTransition name='layout' group={false} default='none'>
  <div className='layout'>
    <ViewTransition name='sidebar' update='auto'>
      <aside>{collapsed ? <Icons /> : <FullMenu />}</aside>
    </ViewTransition>
    ​
    <ViewTransition name='content' update='fade' enter='fade'>
      <main key={route}>...</main>
    </ViewTransition>
  </div>
</ViewTransition>
```

Setting group={false} / default="none" on outer prevents whole layout cross-fading when only sidebar collapses. Children animate independently.

Guide: Default group is auto-grouping. For complex layouts, explicitly disable outer grouping and let inner ViewTransitions own their animation. Otherwise you get huge screenshot morphs.

12. Interruptible + Reduced Motion Guard
    ViewTransitions are interruptible by default in React - spamming tabs/buttons just re-takes snapshot. But long lists can jank.

Best practices:

```jsx

// 1. Disable for large updates
<ViewTransition enter={items.length > 100 ? 'none' : 'fade'} exit="none">
  ...
</ViewTransition>
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
