# Reduced Motion Checks

This tool ensures that when `prefers-reduced-motion: reduce` is set, no element has an animation or transition.
It uses Playwright to render the built example sites and checks the computed styles for all elements.
