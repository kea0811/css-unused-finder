/** Demo content for the "Load example" button — intentionally a little messy. */
export const SAMPLE_CSS = `/* A real-world-ish stylesheet with a few smells baked in */
* {
  box-sizing: border-box;
}

#app .layout .sidebar ul li a {
  color: #6366f1;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.btn {
  font-weight: 600 !important;
}

ul.nav {
  display: flex;
  gap: 1rem;
}

.modal {
  position: fixed;
  z-index: 9999;
}

.card.is-active.is-featured.has-shadow {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.legacy-banner {
  background: #f59e0b;
}

.unused-helper {
  display: none;
}
`;

export const SAMPLE_MARKUP = `<nav class="nav">
  <a class="btn" href="/">Home</a>
</nav>
<main class="layout">
  <div class="card is-active">Featured</div>
  <div class="modal">Dialog</div>
</main>`;
