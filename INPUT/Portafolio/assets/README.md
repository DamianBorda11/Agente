# assets/

Put the real images here (illustrations, project covers, film stills).

The cards are rendered from `js/data.js`, so you don't edit the HTML to add an image.
Add an `image` field to the project object:

```js
{
  id: "illustration-01",
  title: "Ilustración 01",
  image: "assets/illustration-01.jpg", // replaces the placeholder in the card and the lightbox
  // ...
}
```

The `title` is also used as the image `alt` text, so make it descriptive.

Tips:
- Use lowercase file names with hyphens, no spaces or accents (`illustration-01.jpg`).
- Export at ~1600px wide max and compress (e.g. squoosh.app) to keep the site fast.
