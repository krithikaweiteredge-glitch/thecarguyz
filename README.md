# The Car Guyz — website

Anime-styled single-page site for a car wash / detailing / PPF business.
Static HTML, CSS and JS. No build step, no dependencies to install.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
npx -y serve -l 4321 .
```

## Files

| File | What's in it |
|---|---|
| `index.html` | All page content and the four crew SVGs |
| `styles.css` | Design tokens + every style rule |
| `main.js` | Loader, nav, scroll reveals, counters, tilt, slider, form, WebGL hero |
| `assets/logo.jpg` | Your logo, as supplied (nav + footer) |
| `assets/logo-mark.png` | Dark-mode build of it, for the loader |
| `design-system/the-car-guyz/MASTER.md` | Generated design system this was built against |

Three.js r128 loads from a CDN — the page needs internet on first load.
If WebGL is unavailable the hero falls back to the static gradient background.

## Loader

The loading screen shows `assets/logo-mark.png` with the progress bar beneath
it. That file is a dark-mode build of the supplied logo: the artwork is drawn
for white paper, with a black wordmark and black car outlines, so dropping it
straight onto the dark loader would have hidden half of it. The ink is inverted
to white, the reds are kept, and the paper is knocked out to transparent.

Regenerating it from a new logo means redoing that inversion — the source file
stays `assets/logo.jpg`, which is still what the nav and footer use as-is.

## Hero stage

Three stacked image layers, back to front, inside `.hero__stage`:

| Layer | File | Job |
|---|---|---|
| `.hero__slashes` | `assets/hero/slashes.png` | red/blue brush slashes, screen blend |
| `.hero__char` | `assets/art/figure-cut.png` | the character, standing behind |
| `.hero__car` | `assets/hero/car-cut.png` | the car, cut out, in front |

Each floats on its own keyframe loop and parallaxes against the pointer by its
`data-depth`. The keyframes read `--px`/`--py`/`--rot`, which `art.js` writes —
the animation owns `transform`, so parallax has to ride inside the keyframe
rather than being set on the element.

The car cutout is GrabCut with hand-placed seeds. The floor shadow in the photo
will run off the left edge as a grey band unless the left strip is fenced off as
definite background for the full height.

`assets/hero/car-lights.png` is the headlight glow, aligned to the car by using
exactly the same `background-size` and `background-position` as `.hero__car`.
Change one and you must change the other or the glow slides off the lamps.

## Feature artwork

"The Standard" uses `assets/art/standard.jpg` — a full scene, character and car
together, rather than a cut-out figure. `art.js` tags it `is-scene`, which
switches off the elliptical vignette, the red aura and the buff sweep (the
scene carries its own lighting) and swaps the hard 3D turn for a slow drift.

On desktop it is positioned absolutely from 34% to the right edge of the stage,
so it bleeds off the right, top and bottom. Only the edge that meets the copy
is dissolved, by a gradient to the section background `#040507`. Fading all
four edges instead just reads as a rectangle with soft corners. Below 900px the
layout stacks, so the blend runs downward into the copy instead.

`assets/art/figure-cut.png` is the earlier cut-out character, kept as the
fallback if the scene is missing. It floats in 3D via `artFloat3d` and leans
toward the cursor through `--cx`/`--cy`/`--cr`. It was briefly rebuilt as a
WebGL point cloud; that read as blurry and showed the sampling lattice, so the
image is kept intact instead. Do not "tidy" its GrabCut mask with a
morphological close plus a flood fill — the hair and shoulders enclose the red
moon, so filling holes swallows the background straight back in.

## Before / after slider

`assets/work/before.jpg` and `assets/work/after.jpg` feed the slider in the
Work section. Drag anywhere on the panel, or use the arrow keys. Both files
must be the same size and framing or the two halves will not line up.

## Language

English only. No Japanese text anywhere in the markup or styles.
