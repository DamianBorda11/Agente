// ==========================================================================
// Damián Borda — Portfolio
// Shared script for index.html, works.html and cine.html.
// Needs js/data.js loaded first (it defines `projects`, `films`,
// `CATEGORIES` and `FILM_ROLES`).
// Each init function checks that its elements exist before doing anything,
// so the same file can be loaded on every page.
// ==========================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- Render helpers ----------
// The HTML is built with template literals and inserted with innerHTML.
// That is fine here because the text comes from our own data.js; never do
// it with text typed by a user (it could inject HTML/scripts).

// ["director", "editor"] + FILM_ROLES -> ["Director", "Editor"]
function getLabels(keys, labelMap) {
  return keys.map((key) => labelMap[key]);
}

// A film has `roles`, a project has `categories`
function getItemLabels(item) {
  return item.roles
    ? getLabels(item.roles, FILM_ROLES)
    : getLabels(item.categories, CATEGORIES);
}

function createMedia(item, shape = "") {
  if (item.image) {
    return `<img class="card__image" src="${item.image}" alt="${item.title}" loading="lazy">`;
  }

  const classes = ["placeholder", `placeholder--v${item.variant}`];
  if (shape) classes.push(`placeholder--${shape}`);
  const label = getItemLabels(item)[0].toUpperCase();

  return `<span class="${classes.join(" ")}" data-label="${label}"></span>`;
}

function createProjectCard(project, useShape = false) {
  return `
    <button class="card" type="button" data-id="${project.id}">
      ${createMedia(project, useShape ? project.shape : "")}
      <span class="card__body">
        <span class="card__meta">${getItemLabels(project).join(" · ")} · ${project.year}</span>
        <span class="card__title">${project.title}</span>
        <span class="card__text">${project.description}</span>
      </span>
    </button>`;
}

function createFilmCard(film) {
  return `
    <button class="card film" type="button" data-id="${film.id}">
      ${createMedia(film, "wide")}
      <span class="card__body">
        <span class="card__meta">${getItemLabels(film).join(" · ")}</span>
        <span class="card__title">${film.title}</span>
        <span class="card__text">${film.description}</span>
        <span class="film__info">${film.year} · ${film.duration}</span>
      </span>
    </button>`;
}

function renderList(container, list, createCard) {
  container.innerHTML = list.length
    ? list.map(createCard).join("")
    : `<p class="section__lead">Nada en esta categoría todavía.</p>`;
}

// ---------- Home: featured projects + featured films ----------
function initHome() {
  const featuredGrid = document.querySelector("#featured-grid");
  const filmGrid = document.querySelector("#film-grid");

  if (featuredGrid) {
    const featured = projects.filter((project) => project.featured);
    renderList(featuredGrid, featured, (project) => createProjectCard(project));
  }

  if (filmGrid) {
    const featured = films.filter((film) => film.featured);
    renderList(filmGrid, featured, createFilmCard);
  }
}

// ---------- Archive page with filters (works.html and cine.html) ----------
// Same function for both pages; what changes is passed in `config`:
// - grid / filters  CSS selectors of the containers
// - items           the array to show (projects or films)
// - labels          filter key -> label (CATEGORIES or FILM_ROLES)
// - field           the item property that holds the keys ("categories" or "roles")
// - createCard      function that turns one item into HTML
function initArchive(config) {
  const grid = document.querySelector(config.grid);
  const filters = document.querySelector(config.filters);
  if (!grid || !filters) return;

  const showItems = (filter) => {
    const list =
      filter === "all"
        ? config.items
        : config.items.filter((item) => item[config.field].includes(filter));
    renderList(grid, list, config.createCard);
  };

  // Filter buttons are also generated from data: ALL + one per label
  const filterKeys = ["all", ...Object.keys(config.labels)];
  filters.innerHTML = filterKeys
    .map((key) => {
      const label = key === "all" ? "All" : config.labels[key];
      const isActive = key === "all";
      return `<button class="filter-btn${isActive ? " is-active" : ""}" type="button"
        data-filter="${key}" aria-pressed="${isActive}">${label.toUpperCase()}</button>`;
    })
    .join("");

  // One listener on the container instead of one per button (event delegation)
  filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");
    if (!button) return;

    filters.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn === button);
      btn.setAttribute("aria-pressed", btn === button);
    });
    showItems(button.dataset.filter);
  });

  showItems("all");
}

// ---------- Lightbox (any card on any page) ----------
function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const media = lightbox.querySelector(".lightbox__media");
  const meta = lightbox.querySelector(".lightbox__meta");
  const title = lightbox.querySelector(".lightbox__title");
  const text = lightbox.querySelector(".lightbox__text");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const allItems = [...projects, ...films];

  // Cards are created by JS after the page loads, so we listen on the
  // document and check what was clicked (event delegation).
  document.addEventListener("click", (event) => {
    const card = event.target.closest(".card[data-id]");
    if (!card) return;

    const item = allItems.find((entry) => entry.id === card.dataset.id);
    if (!item) return;

    media.innerHTML = createMedia(item);
    meta.textContent = getItemLabels(item).join(" · ");
    title.textContent = item.title;
    text.textContent = item.duration
      ? `${item.description} (${item.year} · ${item.duration})`
      : `${item.description} (${item.year})`;
    lightbox.showModal(); // Esc closes a modal <dialog> natively
  });

  closeBtn.addEventListener("click", () => lightbox.close());

  // Click outside the content: the click target is the <dialog> itself
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}

// ---------- TV channels: on-screen display (OSD) ----------
// Every <section data-channel="02" data-channel-name="Cine"> is a channel.
// When a new one reaches the middle of the screen, the OSD in the corner
// shows its number and name, like the channel display of an old TV.

function formatTapeTime(totalSeconds) {
  const pad = (n) => String(n).padStart(2, "0");
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `SP ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function initChannels() {
  const sections = document.querySelectorAll("[data-channel]");
  if (!sections.length) return;

  // The OSD is created here, so the HTML of each page stays clean
  const osd = document.createElement("div");
  osd.className = "osd";
  osd.setAttribute("aria-hidden", "true"); // decorative: screen readers skip it
  osd.innerHTML = `
    <span class="osd__mode">▶ Play</span>
    <span class="osd__channel"></span>
    <span class="osd__name"></span>
    <span class="osd__time">${formatTapeTime(0)}</span>`;
  document.body.append(osd);

  const channelEl = osd.querySelector(".osd__channel");
  const nameEl = osd.querySelector(".osd__name");
  const timeEl = osd.querySelector(".osd__time");

  const switchTo = (section) => {
    channelEl.textContent = `CH ${section.dataset.channel}`;
    nameEl.textContent = section.dataset.channelName;
  };

  // rootMargin shrinks the "viewport" to a thin band in the middle of the
  // screen: a section counts as visible only when it crosses that band.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) switchTo(entry.target);
      });
    },
    { rootMargin: "-45% 0px -54% 0px" }
  );
  sections.forEach((section) => observer.observe(section));

  // Tape counter: seconds since the page was opened
  const start = Date.now();
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    timeEl.textContent = formatTapeTime(elapsed);
  }, 1000);
}

// ---------- Mobile navigation ----------
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen);
  });

  // Close the menu after choosing a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---------- Form helpers ----------
function setFieldError(input, message) {
  const error = input.parentElement.querySelector(".form__error");
  input.classList.toggle("is-invalid", Boolean(message));
  input.setAttribute("aria-invalid", Boolean(message));
  if (error) error.textContent = message;
}

// ---------- Contact form (no backend: validation + feedback only) ----------
const INTENT_MESSAGES = {
  company: "Gracias. Te escribo en menos de 48 horas para agendar una llamada sobre tu proyecto.",
  painting: "Gracias. Te enviaré disponibilidad y el proceso para encargar una pieza.",
  web: "Gracias. Te responderé con preguntas para entender tu sitio web.",
  film: "Gracias. Cuéntame más de la historia y te respondo para hablar del rodaje.",
  other: "Gracias por escribir. Te respondo pronto.",
};

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector(".form__status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.querySelector("#contact-name");
    const email = form.querySelector("#contact-email");
    const intent = form.querySelector("#contact-intent");
    const message = form.querySelector("#contact-message");

    const errors = {
      name: name.value.trim().length < 2 ? "Escribe tu nombre." : "",
      email: !EMAIL_REGEX.test(email.value.trim()) ? "Escribe un email válido." : "",
      intent: !intent.value ? "Elige una opción." : "",
      message: message.value.trim().length < 10 ? "Cuéntame un poco más (mínimo 10 caracteres)." : "",
    };

    setFieldError(name, errors.name);
    setFieldError(email, errors.email);
    setFieldError(intent, errors.intent);
    setFieldError(message, errors.message);

    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) {
      status.textContent = "";
      firstInvalid.focus();
      return;
    }

    status.textContent = INTENT_MESSAGES[intent.value];
    form.reset();
  });
}

// ---------- Newsletter (footer) ----------
function initNewsletter() {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const input = form.querySelector("input[type='email']");
  const feedback = form.parentElement.querySelector(".newsletter__feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!EMAIL_REGEX.test(input.value.trim())) {
      input.classList.add("is-invalid");
      feedback.textContent = "Ese email no parece válido.";
      return;
    }

    input.classList.remove("is-invalid");
    feedback.textContent = "Listo. Ya estás en la lista.";
    form.reset();
  });
}

// ---------- Footer year ----------
function initYear() {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initHome();
  initArchive({
    grid: "#projects-grid",
    filters: "#project-filters",
    items: projects,
    labels: CATEGORIES,
    field: "categories",
    createCard: (project) => createProjectCard(project, true),
  });
  initArchive({
    grid: "#films-grid",
    filters: "#film-filters",
    items: films,
    labels: FILM_ROLES,
    field: "roles",
    createCard: createFilmCard,
  });
  initLightbox();
  initChannels();
  initNav();
  initContactForm();
  initNewsletter();
  initYear();
});
