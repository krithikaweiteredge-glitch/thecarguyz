# The Car Guyz — website

Anime-styled site for a car wash / detailing / PPF business, split across six
tabbed pages. Static HTML, CSS and JS. No build step, no dependencies to install.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
npx -y serve -l 4321 .
```

## Files

| File | What's in it |
|---|---|
| `index.html` | Home — hero, The Standard, the numbers, what customers said |
| `about.html` | The shop, the five-stage process, the crew |
| `services.html` | All six techniques written out in full, plus the extras |
| `gallery.html` | Before/after slider, the wash video, photographed stages |
| `pricing.html` | The three grades and the FAQ |
| `contact.html` | Booking form, hours, address |
| `styles.css` | Design tokens + every style rule |
| `main.js` | Loader, nav, scroll reveals, counters, tilt, slider, form, media band, WebGL hero |
| `assets/logo.jpg` | Your logo, as supplied (nav + footer) |
| `assets/logo-mark.png` | Dark-mode build of it, for the loader |
| `design-system/the-car-guyz/MASTER.md` | Generated design system this was built against |

Every page shares the same nav, footer and stylesheet. The nav marks the
current tab with `aria-current="page"`, which is what draws the red underline —
so adding a page means adding it to the `<nav>` and the mobile menu on all six
files.

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

## The Standard — the comic strip

The home page tells the job as a seven-panel manga page, built as real panels
rather than one flat picture. Every panel is a crop of the same photograph:
`--z` is the zoom (as a background-size percentage) and `--pos` aims it, so one
car shot yields a wheel, a bonnet, a cabin and a grille. Re-framing a panel
means editing those two values on its `<li>` in `index.html`.

Each panel then performs the service it names, in CSS: foam rises and a wipe
takes it away, the wheel is worked in circles, steam lifts off the cabin, the
polisher orbits, water pulls into beads and rolls off the coating, and the
finished car throws a gloss sweep back. The effects hang off a per-panel
`fx-*` class and only run once the panel has `.is-in`, which `main.js` sets
when it scrolls into view, so nothing animates off screen. All of it is off
under `prefers-reduced-motion`.

On a phone the grid collapses to one column, so each panel is full width and
its speech box is readable — the thing that made the original single-image
version unusable on mobile.

## Photography and video

The service, gallery and banner photographs are hotlinked from Pexels (free to
use, no attribution required). They are there so the site looks finished before
the shop's own shots exist — swap the `images.pexels.com` URLs for your own
files under `assets/` as the real photos come in.

`assets/video/wash.mp4` is the clip in the band on the home and gallery pages:
10 seconds of a car being foamed down, 720p, 3.2 MB, from Mixkit (free for
commercial use, no attribution required). Replace it with footage of your own
bay and the page picks the new file up with no other change.

`main.js` HEAD-checks that path before it builds the `<video>`, so if the file
is ever missing the band falls back to its poster photograph instead of showing
a broken player. See `assets/video/README.txt` for the encoding to use.

## One thing per page

Nothing is repeated between tabs, and that is deliberate rather than accidental:
the six techniques live on the services page, the photographs and the video on
the gallery, the counters and testimonials on the home page. The home page is a
landing page — it carries nothing another tab already owns, so there is never a
reason to read the same paragraph twice while clicking through.

If you add a section, check it is not already somewhere else. This finds any
text that has drifted onto two pages:

```bash
python -c "import io,re,glob,collections; P=['index.html','about.html','services.html','gallery.html','pricing.html','contact.html']; b=lambda f:re.sub(r'<[^>]+>',' ',re.sub(r'(<header class=.nav.|<footer class=.foot.|<script).*?</(header|footer|script)>','',io.open(f,encoding='utf-8').read(),flags=re.S)); d=collections.defaultdict(set); [d[' '.join(c.split())].add(p) for p in P for c in re.split(r'[.
]',b(p)) if len(' '.join(c.split()))>28]; [print(sorted(v),k[:70]) for k,v in d.items() if len(v)>1]"
```
