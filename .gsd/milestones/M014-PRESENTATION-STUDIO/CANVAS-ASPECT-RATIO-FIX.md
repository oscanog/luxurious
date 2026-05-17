# M014 Bug Fix: Canvas Aspect Ratio Mismatch

## Bug

- blank `16:9` presentation could open with portrait-looking canvas
- editor chrome said `1920 × 1080`, but render size could drift from true presentation size

## Root Cause

Two dimension sources fought each other:

1. presentation document stored `slideWidth` / `slideHeight`
2. some slide JSON stored root `width` / `height`

Editor also hardcoded `1920 × 1080` instead of reading presentation dimensions. Old or conflicting slide JSON could override canvas size and show wrong aspect ratio.

## Fix

- presentation record is now single source of truth for dimensions
- blank slide JSON no longer writes root `width` / `height`
- editor reads `presentation.slideWidth` / `presentation.slideHeight`
- Fabric canvas reapplies presentation dimensions after JSON load
- loader strips legacy root `width` / `height` from stored slide JSON

## Result

- blank `16:9` renders as true landscape
- legacy slides with bad root canvas metadata still open with correct aspect ratio
