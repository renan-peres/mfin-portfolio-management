// See https://observablehq.com/framework/config for documentation.

const FOOTER = `<style>#observablehq-footer { margin-top: 1rem; }</style><a href='https://github.com/renan-peres' target='_blank'>Copyright 2025, Renan Peres</a>.`;
const SOURCE_REPO = "https://github.com/renan-peres/website/blob/main/src";

const VIEW_SOURCE = !SOURCE_REPO
  ? ""
  : `
<a class="view-source" target="_blank" aria-label="Edit this page" title="Edit this page" href="${SOURCE_REPO}" style="display: flex; align-items: center; gap: 4px; text-decoration: none; color: #666;">
  <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
  </svg>
  <span>Edit this page</span>
</a>
<script type="module">
const a = document.querySelector(".view-source");
a.setAttribute("href", a.getAttribute("href") + (
  document.location.pathname
    .replace(/[/]$/, "/index")
    .replace(/^[/]pangea(-proxima)?/, "")
  ) + ".md?plain=1"
);
</script>
`;

const HEADER =  `
<div class="header-container">
  <style>
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .navigation-links {
      display: flex;
      gap: 1rem;
      margin: 0.5rem 0;
    }
    .nav-link {
      text-decoration: none;
      color: #666;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    .nav-link:hover {
      background-color: #161616;
      color: #666;
    }
  </style>
  
  <div class="view-source-container">
    ${VIEW_SOURCE}
  </div>
</div>
`;

export default {
  title: "Portfolio Management Dashboard",
  header: HEADER,
  footer: FOOTER,
  root: "src",
  // Some additional configuration options and their defaults:
  // theme: "default", // try 'dashboard', "light", "dark", "slate", etc.
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
  duckdb: {extensions: ["spatial", "h3", "pivot_table"]},
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  
};
