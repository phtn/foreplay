React's View Transitions API (introduced in React 19) provides a declarative way to animate between different states of your UI. Here's a comprehensive guide to help you master it.

## What is View Transitions?

The View Transitions API allows you to create smooth, animated transitions between different visual states of your application—like navigating between pages, expanding cards, or reordering lists.

## Core Concepts

```mermaid
flowchart TD
    subgraph "View Transition Lifecycle"
        start["Trigger Transition"] --> capture["Capture Snapshot"]
        capture --> update["Update DOM State"]
        update --> animate["Animate Between States"]
        animate --> complete["Transition Complete"]
    end

    subgraph "Key Components"
        vt["<ViewTransition>"] --> name["name prop<br/>(unique identifier)"]
        vt --> mode["mode prop<br/>(layout/position)"]
        vt --> onUpdate["onUpdate callback"]
    end

    subgraph "Shared Elements"
        shared["Shared Element Matching"] --> match["Match by 'name'"]
        match --> morph["Morph Animation"]
    end
```

## Basic Usage

### 1. Simple View Transition

```jsx
import { ViewTransition } from 'react'

function App() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div>
      <button onClick={() => setShowDetails(!showDetails)}>Toggle Details</button>

      <ViewTransition name='card'>{showDetails ? <DetailedCard /> : <CompactCard />}</ViewTransition>
    </div>
  )
}
```

### 2. Page Navigation with View Transitions

```jsx
import { ViewTransition, useNavigate } from 'react'

function ProductList() {
  const navigate = useNavigate()

  return (
    <div className='product-grid'>
      {products.map((product) => (
        <ViewTransition key={product.id} name={`product-${product.id}`} mode='position'>
          <ProductCard product={product} onClick={() => navigate(`/product/${product.id}`)} />
        </ViewTransition>
      ))}
    </div>
  )
}

function ProductDetail({ product }) {
  return (
    <ViewTransition name={`product-${product.id}`} mode='position'>
      <div className='product-detail'>
        <h1>{product.name}</h1>
        <img src={product.image} alt={product.name} />
        <p>{product.description}</p>
      </div>
    </ViewTransition>
  )
}
```

## Advanced Patterns

### 3. List Reordering with Animations

```jsx
import { ViewTransition } from 'react'

function SortableList({ items }) {
  const [sortedItems, setSortedItems] = useState(items)

  const sortBy = (key) => {
    const sorted = [...sortedItems].sort((a, b) => a[key].localeCompare(b[key]))
    setSortedItems(sorted)
  }

  return (
    <div>
      <button onClick={() => sortBy('name')}>Sort by Name</button>
      <button onClick={() => sortBy('date')}>Sort by Date</button>

      <ul>
        {sortedItems.map((item) => (
          <ViewTransition
            key={item.id}
            name={`list-item-${item.id}`}
            mode='layout' // Animates position changes
          >
            <li>{item.name}</li>
          </ViewTransition>
        ))}
      </ul>
    </div>
  )
}
```

### 4. Custom Transition with onUpdate

```jsx
import { ViewTransition, useViewTransition } from 'react'

function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState(null)
  const { startViewTransition } = useViewTransition()

  const handleSelect = (image) => {
    // Custom transition with callback
    startViewTransition(() => {
      setSelectedImage(image)
    })
  }

  return (
    <div>
      {selectedImage ? (
        <ViewTransition
          name={`image-${selectedImage.id}`}
          onUpdate={(instance) => {
            // Custom animation control
            instance.ready.then(() => {
              // Animation is ready to start
              console.log('Transition ready')
            })

            instance.finished.then(() => {
              // Animation completed
              console.log('Transition finished')
            })
          }}>
          <ExpandedImage image={selectedImage} onClose={() => setSelectedImage(null)} />
        </ViewTransition>
      ) : (
        <div className='gallery'>
          {images.map((image) => (
            <ViewTransition key={image.id} name={`image-${image.id}`} mode='position'>
              <Thumbnail image={image} onClick={() => handleSelect(image)} />
            </ViewTransition>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 5. Nested View Transitions

```jsx
import { ViewTransition } from 'react'

function Dashboard() {
  const [activePanel, setActivePanel] = useState('overview')

  return (
    <ViewTransition name='dashboard'>
      <div className='dashboard'>
        <ViewTransition name='sidebar'>
          <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
        </ViewTransition>

        <ViewTransition name='main-content'>
          <main>
            {activePanel === 'overview' && (
              <ViewTransition name='overview-panel'>
                <OverviewPanel />
              </ViewTransition>
            )}
            {activePanel === 'analytics' && (
              <ViewTransition name='analytics-panel'>
                <AnalyticsPanel />
              </ViewTransition>
            )}
          </main>
        </ViewTransition>
      </div>
    </ViewTransition>
  )
}
```

## CSS Integration

### 6. Customizing Animations with CSS

```css
/* Default view transition animations */
::view-transition-old(root) {
  animation: fade-out 300ms ease-out;
}

::view-transition-new(root) {
  animation: fade-in 300ms ease-in;
}

/* Custom named transitions */
::view-transition-old(product-card),
::view-transition-new(product-card) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Specific element animations */
::view-transition-image(product-image) {
  animation: scale-up 400ms ease-out;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-up {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

## Best Practices

| Practice                             | Description                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| **Use unique names**                 | Each `name` prop should be unique and stable across renders |
| **Match names across views**         | For shared elements, use the same `name` in both states     |
| **Prefer `mode="position"`**         | For elements that change position but not size/shape        |
| **Use `mode="layout"`**              | For elements that change size, shape, or position           |
| **Keep transitions short**           | 200-500ms is ideal for most transitions                     |
| **Respect `prefers-reduced-motion`** | Disable animations for accessibility                        |

### 7. Accessibility Considerations

```jsx
import { ViewTransition } from 'react'

function AccessibleTransition({ children, name }) {
  const prefersReducedMotion =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false

  if (prefersReducedMotion) {
    return children // Skip animation
  }

  return (
    <ViewTransition name={name} mode='layout'>
      {children}
    </ViewTransition>
  )
}
```

## Common Patterns Summary

```mermaid
flowchart LR
    subgraph "When to Use"
        nav["Page Navigation"] --> shared["Shared Elements"]
        list["List Reordering"] --> morph["Morph Animations"]
        expand["Expand/Collapse"] --> layout["Layout Shifts"]
    end

    subgraph "Mode Selection"
        position["mode='position'"] --> posUse["Elements moving<br/>same shape/size"]
        layout["mode='layout'"] --> layUse["Size/shape changes"]
    end
```

## Key Takeaways

1. **Name matching is crucial** — Elements with the same `name` prop will animate between each other
2. **Modes matter** — Choose `position` for movement, `layout` for structural changes
3. **CSS enhances control** — Use `::view-transition-*` pseudo-elements for custom animations
4. **Performance** — The browser handles the animation off-main-thread for smooth 60fps
5. **Progressive enhancement** — Works with or without JavaScript enabled

Would you like me to dive deeper into any specific aspect, such as integrating with React Router, handling complex nested transitions, or performance optimization techniques?
