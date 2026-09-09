# Portfolio hero generated assets

Final workspace assets: `public/hero/sleeping-baby.webp` and `public/hero/cloud.webp`. The transparent PNG outputs listed below were converted to WebP while preserving alpha.

Generation mode: built-in image_gen. Two separate generate calls, one per distinct asset. No variants or retries.

## Sleeping baby

File: exec-632ce391-5249-4cfd-b116-5beedaecd143.png
Dimensions: 1254 x 1254; ARGB PNG; transparent exterior, alpha values sampled 0–253.

Prompt:

Use case: stylized-concept
Asset type: A single premium 3D-rendered cutout centerpiece for the right side of a warm cream designer portfolio hero; text will be added separately in HTML.
Primary request: An exceptionally adorable imaginary baby sleeping peacefully, fully and modestly swaddled inside a thick ivory bouclé/fleece blanket, nestled on a softly folded circular blanket nest.
Scene/backdrop: Genuinely transparent alpha background, isolated cutout. No background color, no floor, no backdrop, no checkerboard drawn into the image. Only baby and blanket nest are visible.
Subject: A peaceful, believable baby face with closed eyes, relaxed soft cheeks and a very subtle contented expression. A tiny hand may rest close to the cheek. Head and face visible; body fully wrapped. Not a real identifiable baby.
Style/medium: Exquisite high-end stylized 3D animation-film rendering, gentle sophisticated character design, appealing natural proportions and convincing facial anatomy. Tactile and emotionally warm, never a plastic doll. Fine skin detail, delicate subsurface scattering, soft peach fuzz.
Composition/framing: Elevated three-quarter studio camera, complete little circular blanket nest visible with generous clear margin on all sides. Square composition. The head is the visual focus in the upper-middle of the blanket nest. Compact self-contained silhouette, enough depth and careful folds to feel sculptural. Render at the highest practical resolution for a large desktop hero.
Lighting/mood: Soft warm studio illumination, delicate ambient occlusion within blanket folds, luminous serene face, gentle nuanced highlights, calm intimate restful mood.
Color palette: Warm ivory, soft cream, delicate blush cheeks, pale oat accents.
Materials/textures: Plush thick ivory bouclé/fleece with beautifully rendered fine individual fibers and subtle loops; naturally folded blanket with softly rounded thickness. Exceptionally convincing texture at large display size.
Constraints: One sleeping baby and its blanket only. No additional props, toys, accessories, hats, text, logos, watermark. Preserve genuine alpha transparency around the entire silhouette and fiber edges.

## Cloud bank

File: exec-f77ffa51-c6ca-4426-8293-bd446ef50ce5.png
Dimensions: 2172 x 724; ARGB PNG; transparent exterior, alpha values sampled 0–253.

Prompt:

Use case: stylized-concept
Asset type: Transparent cloud-bank cutout for multiple parallax planes of an azure-blue designer portfolio hero, accompanying a sleeping baby swaddled in white fleece.
Primary request: One exceptionally beautiful horizontal bank of billowy soft white clouds, with several rounded overlapping cloud lobes, isolated on genuine transparent alpha background.
Scene/backdrop: Genuinely transparent background, no sky painted behind it, no floor, no checkerboard pixels. Only the cloud bank is visible.
Style/medium: Premium high-quality volumetric 3D animation-film render, airy soft cottony volume, translucent wispy edges, delicate internal depth. Serene and dreamlike, subtle and sophisticated. Clouds should feel like actual fluffy atmospheric vapor rather than solid plastic objects.
Composition/framing: Wide horizontal composition approximately 3:1 aspect ratio. Entire cloud bank visible, no cropping, with transparent padding on every side. Graceful soft asymmetrical silhouette formed from large and small billows, lower flattened wispy edge, slightly taller billows toward the center. Readable as a single versatile layer at desktop scale. High resolution.
Lighting/mood: Soft daylight from upper left, luminous snowy white highlights and very subtle pale sky-blue shaded undersides, diffuse soft transitions, no harsh edges or shadow.
Color palette: Pure soft white and very pale clear sky blue, suitable on an azure-blue background.
Constraints: One cloud bank only. No baby, no blanket, no sun, moon, stars, rainbows, birds, toys, props, ground, typography, text, watermark or logo. Preserve actual alpha transparency around the entire cloud bank, with naturally feathered translucent vapor edges.

## Layered hero update — 2026-09-09

The current character uses three separate 1254 × 1254 generated source plates. All were generated with the built-in image_gen tool, once per asset, from the original sleeping-baby image. Final workspace files are `public/hero/baby-layer.webp`, `public/hero/blanket-back.webp`, and `public/hero/blanket-front.webp`; dimensions are retained and WebP quality is 95. The previously generated cloud asset is reused on six independent meshes.

These generated source plates are RGB and contain a neutral checkerboard rather than a usable alpha channel. The WebGL material keys out neutral background pixels at render time; skin and ivory fabric retain their warm color. The original combined image remains the accessible loading and non-WebGL fallback. These are photographic layers with actual perspective/parallax, not a rigged character or a simulated cloth model.

The following audit records all exact prompts and original generation results:
# Sleeping baby hero layer generation audit

Date: 2026-09-09

Mode: built-in image_gen editing, three parallel calls, one call per asset, no variants or retries. The original reference was inspected with view_image before generation. No website checkout files were edited.

Reference: C:/Users/alpha/Desktop/WOOTAN/@Programming/260909 designer-portfolio/public/hero/sleeping-baby.webp

## Result

Generation completed, but **all three deliverables failed the genuine transparent-alpha requirement**: they are 1254 × 1254 RGB PNGs (PNG IHDR color type 2, System.Drawing Format24bppRgb), with visible painted checkerboard backgrounds. There is no alpha channel. The requested highest native resolution of 2048 square or above was also not honored. These are raw generated images and must not be called transparent-ready. No pixel processing or edits have been applied.

## baby

Absolute output path: `C:/Users/alpha/.codex/generated_images/01a0847a-1f65-7c03-a701-2c20a04c41d9/exec-e1e682ed-fab0-4838-95df-f7f0b66aea9c.png`

Dimensions: 1254 × 1254. Alpha: absent; RGB, color type 2. All sampled corner alpha values resolve as 255.

Visual inspection: The correct sleeping pose, face character, curled right-side hand and ivory onesie are present. However, the baby is visibly enlarged: head bounds roughly x34–83%, y8–58% and torso extends to y88%, rather than preserving reference head bounds roughly x40–72%, y11–41%. Manual registration or a further edit would be necessary for stacking.

### Exact final prompt

```text
Use case: identity-preserve.
Asset type: transparent PNG middle character layer for a layered website hero.
Input image 1 is the edit target and the strict identity, pose, scale, canvas registration, camera, and lighting reference.
Primary request: extract only this same peaceful sleeping baby, removing ALL of the thick ivory fleece blanket around and over the baby. Retain the exact same baby face, light brown hair, closed eyes, small smile, and tiny curled hand beside the cheek on viewer's right. Reconstruct a natural neck, shoulders, and clothed upper body under the removed blanket, wearing a plain soft ivory cotton long-sleeved onesie. The baby remains entirely clothed.
Composition: retain the original square canvas with generous transparency around the baby. DO NOT crop or enlarge to fill the canvas. Baby head centered at approximately x55%, y26% of canvas, same tilted pose as reference; clothed upper body centered around x52%, y52%, ending naturally at about y73%, with shoulders and sleeves available for overlapping blanket layers. Preserve original head size, perspective and facial placement. Keep the curled hand adjacent to viewer-right cheek.
Lighting: match the reference's warm soft diffused studio illumination and very gentle shadow modeling, polished photorealistic studio photograph. Improve natural fine hair, eyelashes, skin and cotton detail for sharp crisp premium rendering without harsh contrast or plastic skin.
Output: one genuine transparent-background PNG with alpha at highest native crisp resolution, ideally 2048 by 2048 or above. Transparent canvas means real zero alpha, not painted white, black or checkerboard. Only baby and ivory cotton onesie; absolutely no fleece, no blanket, no pillow, no cloud, no background. Clean fine hair edges with natural semitransparent antialiasing. No text, labels, watermark, frame, checkerboard pattern, cut-straight object edge, or decorative element.
```

## back-blanket

Absolute output path: `C:/Users/alpha/.codex/generated_images/01a0847a-1f65-7c03-a701-2c20a04c41d9/exec-a7a731bd-8ecc-484e-8572-e7ccec4a3663.png`

Dimensions: 1254 × 1254. Alpha: absent; RGB, color type 2. All sampled corner alpha values resolve as 255.

Visual inspection: The baby has been completely removed and replaced with a continuous concave fleece surface. Nest scale is close to the reference. Folds are detailed and dimensionally shaded.

### Exact final prompt

```text
Use case: precise-object-edit.
Asset type: transparent PNG BACK blanket nest layer for a layered website hero.
Input image 1 is the edit target and the exact canvas registration, fleece material, color, silhouette, camera, and lighting reference.
Primary request: create the BACK blanket nest alone by removing the baby completely, including all hair, face, skin, hand and clothing, and also remove the FRONT swaddling flap that was wrapped over the baby's chest and lower body. Retain the soft thick ivory boucle/fleece rear cushion and side nest. Where the baby used to rest, show a softly concave continuous fleece cushion with a shallow head depression at approximately x55%,y26% and torso depression around x52%,y52%, ready for the separate character layer to sit on top. The nest should be soft and rounded, with no obvious person-shaped hole.
Composition: preserve the full original square canvas and original scale and perspective. Back blanket spans approximately 90% of the canvas width, with an organically rounded outer silhouette and folds supporting the head and along the sides. Retain generous enough continuous padding in the middle for layering, but there must be no high FRONT crossover swaddle flap obscuring where the baby will rest. Never tight-crop or re-center the object.
Lighting: exactly match warm soft diffused studio lighting of reference, subtle deep fold shadows for sculptural volume, ivory creamy color, highly photorealistic premium fleece with many tiny crisp natural fibers and boucle loops.
Output: one genuine transparent-background PNG with alpha, highest native crisp resolution ideally 2048 by 2048 or above. Outside the blanket silhouette use genuine transparent alpha, never painted white, black or checkerboard. Clean fuzzy edges with natural semitransparent antialiasing. No baby, face, hair, skin, hand, person, clothes, cloud, background, text, labels, watermark, frame, or straight cut edges.
```

## front-wrap

Absolute output path: `C:/Users/alpha/.codex/generated_images/01a0847a-1f65-7c03-a701-2c20a04c41d9/exec-db64f868-da9f-4a9d-bc65-1e99b89d1840.png`

Dimensions: 1254 × 1254. Alpha: absent; RGB, color type 2. All sampled corner alpha values resolve as 255.

Visual inspection: Correct lower wrap shape with empty intended top region, a center dip around y42%, and bottom around y95%. Side folds extend above 38% to approximately y31%. This is usable shape content if a clean alpha is obtained.

### Exact final prompt

```text
Use case: precise-object-edit.
Asset type: transparent PNG FRONT lower folded fleece wrap layer for a layered website hero.
Input image 1 is the edit target and the exact canvas registration, fleece material, color, folds, camera, and lighting reference.
Primary request: retain only the LOWER FOREGROUND ivory fleece blanket folds and crossing swaddle wrap from this reference. Completely remove the baby and the high rear and side blanket nest. This is an independent natural foreground fold that overlays the separate baby and rear blanket.
Composition is critical: preserve the full original square canvas, with all foreground fabric kept in the SAME lower portion and scale as the reference, never cropped tight or moved upward. Upper canvas must be empty genuine transparency. The front wrap occupies roughly the bottom 62% of canvas: its upper edge rises softly at the sides, with the upper-center edge dipping below the baby's chin around x55%,y43%, leaving the face/head area fully transparent. Retain natural diagonal overlapping folds below the chin and across the torso down to the original rounded lower hem around y95%. Preserve the reference's rounded lower silhouette and fabric scale. This must be an organically draped sculptural fabric flap with no straight horizontal cut edge and no artificial face-shaped hole; all area above its curved top edge is transparent. Its lower portion has enough continuous fleece coverage to hide the baby's torso below.
Lighting: same warm soft diffused illumination as reference with subtle natural shadow depths in the folds, creamy ivory color, sharp premium photorealism with very fine natural boucle loops and fuzzy fleece fibers.
Output: one genuine transparent-background PNG with alpha, highest native crisp resolution ideally 2048 by 2048 or above. Use actual zero-alpha empty pixels, no white/black background or checkerboard. Clean soft fiber edges with natural semitransparent antialiasing. No baby, face, hair, skin, hand, human, onesie, clouds, separate rear nest, background, text, labels, watermark, frame, or straight cut edges.
```
