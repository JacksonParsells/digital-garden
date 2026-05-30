document.addEventListener("DOMContentLoaded", () => {
  initSearch();
  initCategories();
  initMobileSidebars();
});

/* ==========================================================================
   1. Local Search Engine
   ========================================================================== */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  if (!searchInput || !searchResults) return;

  let searchIndex = [];

  // Fetch search data index once input receives focus
  searchInput.addEventListener("focus", () => {
    if (searchIndex.length > 0) return;
    fetch("/assets/js/search-data.json")
      .then((res) => res.json())
      .then((data) => {
        searchIndex = data;
      })
      .catch((err) => console.error("Could not fetch search index:", err));
  }, { once: true });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      searchResults.style.display = "none";
      searchResults.innerHTML = "";
      return;
    }

    const matches = searchIndex.filter((item) => {
      const titleMatch = item.title && item.title.toLowerCase().includes(query);
      const contentMatch = item.content && item.content.toLowerCase().includes(query);
      const tagsMatch = item.tags && Array.isArray(item.tags) 
        ? item.tags.some(tag => tag.toLowerCase().includes(query))
        : item.tags && typeof item.tags === 'string' && item.tags.toLowerCase().includes(query);
      return titleMatch || contentMatch || tagsMatch;
    }).slice(0, 8); // limit to 8 results

    renderSearchResults(matches, query);
  });

  // Close search results dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });
}

function renderSearchResults(matches, query) {
  const searchResults = document.getElementById("search-results");
  if (matches.length === 0) {
    searchResults.innerHTML = `<div class="search-no-results">No rooms match your description...</div>`;
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = matches.map((item) => {
    // Highlight matching query in title
    const highlightedTitle = highlightMatch(item.title || "", query);
    
    // Add small tag pill if tag matches
    let tagsStr = "";
    if (item.tags) {
      const tagsArr = Array.isArray(item.tags) ? item.tags : [item.tags];
      tagsStr = tagsArr.map(tag => `<span class="search-tag-pill">#${tag}</span>`).join(" ");
    }

    return `
      <a href="${item.url}" class="search-result-item">
        <div class="search-result-title">
          <span>🕯️ ${highlightedTitle}</span>
          ${tagsStr}
        </div>
        <div class="search-result-snippet">${highlightMatch(item.content || "", query)}...</div>
      </a>
    `;
  }).join("");

  searchResults.style.display = "block";
}

function highlightMatch(text, query) {
  if (!text) return "";
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) {
    // Return truncated text
    return text.length > 60 ? text.substring(0, 57) + "..." : text;
  }
  
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + query.length + 40);
  let snippet = text.substring(start, end);
  
  // Apply bold highlighting to query within snippet
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, "ig");
  snippet = snippet.replace(regex, `<mark class="search-highlight">$1</mark>`);

  return (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : "");
}

/* ==========================================================================
   2. Categories / Navigation Tree
   ========================================================================== */
function initCategories() {
  const headers = document.querySelectorAll(".category-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      toggleCategory(header);
    });
  });

  // Automatically expand category of the current active page
  const activeLink = document.querySelector(".sidebar-note-link.active");
  if (activeLink) {
    const parentNotesContainer = activeLink.closest(".category-notes");
    if (parentNotesContainer) {
      parentNotesContainer.style.display = "block";
      const header = parentNotesContainer.previousElementSibling;
      if (header && header.classList.contains("category-header")) {
        header.classList.add("active");
        const icon = header.querySelector(".category-icon");
        if (icon) icon.innerText = "📂";
      }
    }
  }
}

function toggleCategory(header) {
  const notesContainer = header.nextElementSibling;
  const icon = header.querySelector(".category-icon");
  const isExpanded = notesContainer.style.display === "block";

  if (isExpanded) {
    notesContainer.style.display = "none";
    header.classList.remove("active");
    if (icon && !header.dataset.root) icon.innerText = "📁";
  } else {
    notesContainer.style.display = "block";
    header.classList.add("active");
    if (icon && !header.dataset.root) icon.innerText = "📂";
  }
}

/* ==========================================================================
   3. Mobile Responsive Drawer Toggles
   ========================================================================== */
function initMobileSidebars() {
  const leftToggle = document.getElementById("left-sidebar-toggle");
  const rightToggle = document.getElementById("right-sidebar-toggle");
  const leftSidebar = document.getElementById("sidebar-left");
  const rightSidebar = document.getElementById("sidebar-right");

  if (leftToggle && leftSidebar) {
    leftToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      leftSidebar.classList.toggle("open");
      if (rightSidebar) rightSidebar.classList.remove("open");
    });
  }

  if (rightToggle && rightSidebar) {
    rightToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      rightSidebar.classList.toggle("open");
      if (leftSidebar) leftSidebar.classList.remove("open");
    });
  }

  // Close drawers when clicking anywhere on main content
  const centerContent = document.querySelector(".center-content");
  if (centerContent) {
    centerContent.addEventListener("click", () => {
      if (leftSidebar) leftSidebar.classList.remove("open");
      if (rightSidebar) rightSidebar.classList.remove("open");
    });
  }
}
