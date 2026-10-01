// ==========================================================================
// Portfolio content as data.
// Two arrays of objects: `projects` (works.html) and `films` (cine.html).
// The pages are rendered from them by js/main.js. To add an item, copy an
// object and change its values.
//
// Loaded with a normal <script> BEFORE main.js (no import/export), so the
// site works by opening the .html file directly, without a server.
// ==========================================================================

// Filter key -> visible label
const CATEGORIES = {
  "art-direction": "Art direction",
  "web-design": "Web design",
  "ui-ux": "UI/UX",
  illustration: "Illustration",
};

const FILM_ROLES = {
  director: "Director",
  writer: "Guionista",
  editor: "Editor",
};

/*
  Project fields:
  - id           unique text, no spaces (must not repeat in `films` either)
  - title        visible title (also used as image alt text)
  - categories   array of CATEGORIES keys (a project can have several)
  - year         number
  - description  one or two lines
  - variant      1-6, placeholder color style (ignored when you use `image`)
  - shape        "tall" | "wide" | "square" | "" → card shape in the archive
  - featured     true = appears on the home page
  - image        (optional) "assets/file.jpg" — replaces the placeholder
*/
const projects = [
  {
    id: "illustration-01",
    title: "Ilustración 01",
    categories: ["illustration"],
    year: 2026,
    description: "Pintura digital. Qué cuenta la pieza y qué la inspiró.",
    variant: 1,
    shape: "tall",
    featured: true,
  },
  {
    id: "app-01",
    title: "Proyecto UX/UI 01",
    categories: ["ui-ux", "web-design"],
    year: 2026,
    description: "El problema, la solución y el resultado, en dos líneas.",
    variant: 2,
    shape: "",
    featured: true,
  },
  {
    id: "brand-01",
    title: "Dirección de arte 01",
    categories: ["art-direction"],
    year: 2025,
    description: "Identidad visual y narrativa para un proyecto.",
    variant: 3,
    shape: "square",
    featured: true,
  },
  {
    id: "illustration-02",
    title: "Ilustración 02",
    categories: ["illustration", "art-direction"],
    year: 2025,
    description: "Pintura digital. Descripción breve de la pieza.",
    variant: 5,
    shape: "square",
    featured: false,
  },
  {
    id: "web-01",
    title: "Sitio web 01",
    categories: ["web-design"],
    year: 2025,
    description: "Descripción breve del sitio y su objetivo.",
    variant: 6,
    shape: "",
    featured: false,
  },
  {
    id: "illustration-03",
    title: "Ilustración 03",
    categories: ["illustration"],
    year: 2025,
    description: "Pintura digital. Descripción breve de la pieza.",
    variant: 2,
    shape: "tall",
    featured: false,
  },
  {
    id: "app-02",
    title: "Proyecto UX/UI 02",
    categories: ["ui-ux"],
    year: 2024,
    description: "Investigación, prototipo y pruebas con usuarios.",
    variant: 6,
    shape: "",
    featured: false,
  },
  {
    id: "illustration-04",
    title: "Ilustración 04",
    categories: ["illustration"],
    year: 2024,
    description: "Pintura digital. Descripción breve de la pieza.",
    variant: 4,
    shape: "tall",
    featured: false,
  },
  {
    id: "illustration-05",
    title: "Ilustración 05",
    categories: ["illustration"],
    year: 2024,
    description: "Pintura digital. Descripción breve de la pieza.",
    variant: 1,
    shape: "square",
    featured: false,
  },
];

/*
  Film fields: same as projects, but
  - roles     array of FILM_ROLES keys (what you did in the film)
  - duration  e.g. "12 min"
  - no `shape`: films always use a 16:9 frame
*/
const films = [
  {
    id: "film-01",
    title: "Cortometraje 01",
    roles: ["director", "writer", "editor"],
    year: 2026,
    duration: "12 min",
    description: "Sinopsis corta del cortometraje.",
    variant: 4,
    featured: true,
  },
  {
    id: "film-02",
    title: "Cortometraje 02",
    roles: ["writer", "editor"],
    year: 2025,
    duration: "8 min",
    description: "Sinopsis corta del cortometraje.",
    variant: 3,
    featured: true,
  },
  {
    id: "film-03",
    title: "Cortometraje 03",
    roles: ["director"],
    year: 2024,
    duration: "15 min",
    description: "Sinopsis corta del cortometraje.",
    variant: 5,
    featured: true,
  },
  {
    id: "film-04",
    title: "Cortometraje 04",
    roles: ["editor"],
    year: 2024,
    duration: "5 min",
    description: "Sinopsis corta del cortometraje.",
    variant: 2,
    featured: false,
  },
];
