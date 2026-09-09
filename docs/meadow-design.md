# Wildflower portfolio — 2026-09-09

## Design connection

User direction: natural wildflowers, wind, sunlight, photographic depth. A flower field is a collection of distinct colors and forms that coexist; the archive likewise gathers branding, digital, illustration, game and social work without making every project look alike.

The opening uses an immersive meadow. The archive interprets that idea through varying image sizes, staggered placement and space around each work. A reader concentrates on one project, with its overview and return position preserved. Copy stays direct and keeps the user's original introduction: “작은 호기심으로 만든, 소중한 디자인들을 모았습니다.”

The interface uses the existing local Pretendard font, dark green ink, a light paper surface, and a deep green contact section. There are no new project claims, roles or results.

## Assets and motion

Both images were created with the built-in image generation tool, one request per composition. No retries or upscaling. Final WebP files retain native dimensions, quality 94. Their PNG originals are in `outputs/meadow-originals/`.

- `public/meadow/landscape.webp`: 1586 × 992, 317896 bytes.
- `public/meadow/portrait.webp`: 941 × 1672, 244942 bytes.

The distant layer is photographic. The foreground contains independent 3D flowers: curved and ribbed radial petals, a domed center with 115 modeled florets, curved stems, and narrow leaves. Original parametric geometry is shared through instanced meshes (78 flowers on desktop, 42 when mounted on a small viewport or coarse-pointer device). Hemisphere and directional lighting, perspective, and restrained atmospheric fog give the geometry depth. No external model or texture is required for the flowers.

Each stem uses a damped spring. Pointer and touch strokes are tested against the entire screen-space movement segment, so quick swipes do not skip flower heads. The stem curve, leaves and blossom stay connected as they bend, overshoot and settle. Bounded integration prevents long frames and repeated input from destabilizing the stems. Touch listeners are passive; CSS preserves native vertical scrolling and pinch zoom while allowing horizontal strokes.

Scroll advances the camera into the field, opens the foreground stems to either side, then blends the meadow into the archive. This uses ordinary reversible document scrolling. Pointer and calibrated sensor input affect camera position, roll and stem lean. The original responsive picture remains the fallback. Rendering pauses offscreen and in hidden tabs, handles context loss, and limits device pixel count. The pause control and reduced-motion default show a still scene with a shorter hero.

## Exact landscape prompt

```text
Use case: photorealistic-natural
Asset type: Final full-bleed photographic website hero, landscape 16:10, ideally 3200 x 2000 pixels at highest native detail.
Primary request: An original natural wildflower meadow in warm late-spring sunlight with a light breeze, photographed crouched among the flowers. High-end editorial nature photography with genuine optical depth, softly luminous light and optically sharp middle-distance flowers.
Scene and subject: Spontaneous white daisies, tiny butter-yellow wildflowers, sparse soft apricot and pale pink cosmos, delicate green stems, fine leaves and seed heads. An unarranged living meadow with believable variation, richly detailed real petals and natural plant anatomy.
Composition: Wide 16:10 landscape. Quiet almost empty pale blue sky occupies the upper 40–45 percent, with thin atmospheric haze only. The meadow begins near y=45%. Keep upper-center sky completely open and serene to receive website text later, but do not render any text. Crisp waist-high middle-distance flowers, distant meadow fading gently. Closest low flowers and gently out-of-focus petals frame both bottom corners; natural real-lens depth without blur over the focal flowers.
Lighting and palette: Sunlit and airy, gentle breeze suggested by bending delicate stems, balanced filmic natural green, creamy whites and warm butter yellow with restrained pale apricot/pink accents. Natural light and believable lens rendition.
Constraints: Just meadow and sky. No people, babies, blankets, trees, buildings, mountains, path, visible sun disk, or postcard horizon cliché. No dense clouds. No typography, logo, watermark, border or UI. No 3D render, plastic surfaces, fantasy, watercolor, illustration, oversaturated green or heavy film grain. Deliver a photograph, not a mockup.
```

## Exact portrait prompt

```text
Use case: photorealistic-natural
Asset type: Final full-bleed photographic mobile website hero, a separate portrait 9:16 composition, ideally 1440 x 2560 pixels at highest native detail.
Primary request: An original natural wildflower meadow in warm late-spring sunlight with a light breeze, photographed crouched among the flowers. High-end editorial nature photography with genuine optical depth, softly luminous light and optically sharp middle-distance flowers.
Scene and subject: Spontaneous white daisies, tiny butter-yellow wildflowers, sparse soft apricot and pale pink cosmos, delicate green stems, fine leaves and seed heads. An unarranged living meadow with believable variation, richly detailed real petals and natural plant anatomy.
Composition: Tall portrait 9:16, designed intentionally for mobile rather than cropping a landscape. Quiet almost empty pale blue sky occupies the upper 45 percent, with thin atmospheric haze only. Keep the upper-center completely open and serene to receive website text later, but do not render any text. Most flower heads are at y=50–85% of the image. Crisp waist-high middle-distance flowers, distant meadow fading gently. A few closest gently blurred petals near the bottom edge and lower corners create real-lens depth. No large flower blocks the upper-center text area.
Lighting and palette: Sunlit and airy, gentle breeze suggested by bending delicate stems, balanced filmic natural green, creamy whites and warm butter yellow with restrained pale apricot/pink accents. Natural light and believable lens rendition.
Constraints: Just meadow and sky. No people, babies, blankets, trees, buildings, mountains, path, visible sun disk, or postcard horizon cliché. No dense clouds. No typography, logo, watermark, border or UI. No 3D render, plastic surfaces, fantasy, watercolor, illustration, oversaturated green or heavy film grain. Deliver a photograph, not a mockup.
```

## Saved earlier version

The sleeping-baby version is stored as the annotated remote Git tag `sleeping-baby-v1-20260909`, pointing at `fc5424ff44acf05108bbbfd21946657c9ee8418a`, and as `outputs/versions/sleeping-baby-v1-source.zip`. The archive is a complete tracked-source export including its site assets. Earlier high-resolution PNG originals were separately packaged in `outputs/hero-source-originals.zip`.

## Verification

- Lint, TypeScript production build, static asset validation, and all four existing animation-scheduler tests passed.
- Browser checks at widths 320, 390, 768, 1440 and 2560 found no horizontal document overflow or header collisions.
- The digital filter displayed 16 works; the ice-pack detail opened with all 9 sections, and jumping to section 5 placed it below the fixed header. Returning retained the digital filter.
- Mobile used the portrait composition, the motion control paused the scene, and the footer button copied the exact email address. No browser errors were reported in the final check.
- Physical device orientation was not exercised; the existing permission and calibration flow is retained.

## 3D interaction verification

- Nine scheduler and spring tests pass, including fast strokes, spring return, 30/60/120 fps consistency, repeated-input limits and reversible scroll progression.
- Lint, TypeScript, production build and all 61 projects / 484 media references pass validation.
- Browser checks at 320, 390, 768, 1440 and 2560 pixels found no horizontal overflow. The 390-pixel scene was also tested with a horizontal pointer drag.
- Desktop dragging visibly bends the nearby flowers. Native scrolling advances the camera and the second text scene. The pause control removes the interaction hint, shortens the hero and produces identical consecutive screenshots.
- Opening the nine-section ice-pack project disposes the meadow; returning recreates a single canvas and retains the digital filter with 16 works. The final browser check reported no console errors.
- Browser viewport checks do not emulate a physical phone. Touch hardware and sensor sensitivity still require a real-device check; the calibrated permission flow and native `pan-y pinch-zoom` gesture policy are implemented.
