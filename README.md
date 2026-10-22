# aspen-friends

The cozy, friends-only version of Aspen's site. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Look at it locally

    python3 -m http.server 8000      # then open http://localhost:8000
    # add ?moth=now to the address to make the moth appear straight away

## What's where

| File | What it does |
| --- | --- |
| `index.html` | All the words and links. Edit the text here. |
| `css/style.css` | Colours (variables at the top), boards, signposts, buttons. |
| `js/shark.js` | Aspen's pixel sprite, built from simple shapes. Colours are in `PAL`; poses are in `build()`. |
| `js/scene.js` | The animated sunset header (sky, sea, beach, deck, palm tree, gulls, clouds, grass). Lists every editable sprite in `ASSETS` and every editable colour in `DEFAULT_COLORS`. |
| `js/header-art.js` | Your header overrides, written by `editor.html`. The default file changes nothing. |
| `editor.html` | Open it in a browser (serve the folder, see above). Pick any header part (shark, mug, lantern, palm tree, sun, clouds, gull, driftwood, shells) or the scene colours, edit with a live header preview, then download `header-art.js` into `js/`. Only the parts you changed are saved. |
| `js/main.js` | Runs the header, handles poking the shark (edit the `lines` list), adds fireflies. |
| `js/moth.js` | The rosy maple moth. Same movement as moth-forest's screensaver, but in page coordinates. |
| `js/moth-svg.js` | The moth drawing, generated from moth-forest's moth builder. |
| `assets/aspen.png` | The portrait. |

## Notes

- The page is marked `noindex, nofollow` so search engines leave it alone. Delete that `<meta name="robots">` line in `index.html` if you want it findable.
- The moth never shows for people who have "reduce motion" turned on.
- All file paths are relative, so the site works from any folder or sub-path.
