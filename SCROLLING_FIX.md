# Flexbox Scrolling Fix Documentation

## The Problem

Nested flexbox layouts with scrollable regions require very specific CSS to work properly. The common issue is that child elements don't respect their parent's height constraints.

## The Solution

### 1. Root Container Must Have Fixed Height
```css
body {
  height: 100vh;  /* NOT min-height! */
  overflow: hidden;
}

.app {
  height: 100vh;  /* Fixed height is critical */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 2. All Flex Parents in the Hierarchy Need These Properties
```css
.flex-parent {
  display: flex;
  flex: 1 1 0;        /* NOT just flex: 1 */
  overflow: hidden;
  min-height: 0;      /* Critical for nested flexbox */
  min-width: 0;       /* Prevents width issues */
  height: 100%;       /* Ensures height propagation */
}
```

### 3. Scrollable Children Need These Properties
```css
.scrollable-child {
  flex: 1 1 auto;     /* Can grow and shrink */
  overflow-y: auto;   /* Enable scrolling */
  overflow-x: hidden; /* Prevent horizontal scroll */
  min-height: 0;      /* Critical! */
}
```

## Why Each Property Matters

- **`height: 100vh` on root**: Constrains the entire layout to viewport
- **`flex: 1 1 0`**: Third value (flex-basis) set to 0 prevents content from expanding parent
- **`min-height: 0`**: Overrides default `min-height: auto` which can prevent shrinking
- **`min-width: 0`**: Prevents flex items from overflowing
- **`overflow: hidden` on parents**: Contains children and establishes overflow context
- **`overflow-y: auto` on scrollable**: Creates scroll container

## Our Layout Hierarchy

```
body (height: 100vh, overflow: hidden)
└── .app (height: 100vh, flex column, overflow: hidden)
    ├── .app-header (fixed height)
    └── .app-body (flex: 1 1 0, overflow: hidden, min-height: 0, height: 100%)
        ├── .sidebar (overflow-y: auto, min-height: 0)
        ├── .main-content (flex: 1 1 0, overflow: hidden, min-height: 0, height: 100%)
        │   ├── .task-list (flex: 1 1 0, flex column, overflow: hidden, height: 100%)
        │   │   ├── .task-list-header (fixed height)
        │   │   └── .task-list-content (flex: 1 1 auto, overflow-y: auto, min-height: 0)
        │   └── .task-detail (overflow: hidden, min-height: 0)
        │       └── .task-detail-content (flex: 1 1 auto, overflow-y: auto, min-height: 0)
        └── .stats-panel (overflow-y: auto, min-height: 0)
```

## Testing Checklist

- [ ] Task list scrolls when there are many tasks
- [ ] PRD list scrolls when there are many documents
- [ ] PRD content scrolls for long documents
- [ ] Task detail scrolls for long task descriptions
- [ ] Sidebar scrolls with many filters
- [ ] Stats panel scrolls with many statistics
- [ ] No horizontal scrollbars appear
- [ ] Layout doesn't break on window resize
- [ ] Works in Chrome, Firefox, Safari

## Common Mistakes to Avoid

1. ❌ Using `min-height: 100vh` instead of `height: 100vh` on root
2. ❌ Forgetting `min-height: 0` on flex containers
3. ❌ Using `flex: 1` instead of `flex: 1 1 0` on flex parents
4. ❌ Missing `overflow: hidden` on parent containers
5. ❌ Not using `flex: 1 1 auto` on scrollable children
6. ❌ Forgetting `height: 100%` to propagate height down

## References

- [MDN: Understanding min-height in flex containers](https://developer.mozilla.org/en-US/docs/Web/CSS/min-height)
- [CSS-Tricks: Flexbox scrolling gotchas](https://css-tricks.com/flexbox-truncated-text/)
