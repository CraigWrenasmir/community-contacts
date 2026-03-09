(function () {
  const stateCode = (window.STATE_CODE || "nsw").toLowerCase();
  const stateName = window.STATE_NAME || stateCode.toUpperCase();

  const state = {
    contacts: [],
    postcodeCentroids: {},
    suburbCentroids: [],
    lastRows: [],
    lastSearch: null,
  };

  const locationEl = document.getElementById("location");
  const categoryEl = document.getElementById("category");
  const radiusEl = document.getElementById("radius");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");
  const copyBtn = document.getElementById("copyBtn");
  const emailOnlyEl = document.getElementById("emailOnly");
  const metaEl = document.getElementById("meta");
  const copyMetaEl = document.getElementById("copyMeta");
  const errEl = document.getElementById("error");
  const tableEl = document.getElementById("results");
  const tbodyEl = tableEl.querySelector("tbody");
  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");
  const datasetStatsEl = document.getElementById("datasetStats");

  pageTitle.textContent = `${stateName} Community Contacts Radius Search`;
  pageSub.textContent = "Search nearby organisations by postcode or suburb, filter by category, and copy public email addresses for outreach.";

  function esc(text) {
    return String(text || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const p = Math.PI / 180;
    const dLat = (lat2 - lat1) * p;
    const dLon = (lon2 - lon1) * p;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function resolveCenter(rawQuery) {
    const query = rawQuery.trim();
    if (!query) throw new Error("Enter a postcode or suburb.");

    if (/^\d{4}$/.test(query)) {
      const c = state.postcodeCentroids[query];
      if (!c) throw new Error(`No ${stateName} coordinate found for postcode ${query}.`);
      return { lat: c.lat, lon: c.lon, label: `Postcode ${query}` };
    }

    const lower = query.toLowerCase();
    const exact = state.suburbCentroids.find((s) => String(s.suburb).toLowerCase() === lower);
    if (exact) return { lat: exact.lat, lon: exact.lon, label: `Suburb ${exact.suburb}` };

    const partial = state.suburbCentroids.find((s) => String(s.suburb).toLowerCase().includes(lower));
    if (partial) return { lat: partial.lat, lon: partial.lon, label: `Suburb ${partial.suburb}` };

    throw new Error(`Could not resolve location \"${query}\" to ${stateName} suburb/postcode.`);
  }

  function renderRows(rows) {
    if (!rows.length) {
      tbodyEl.innerHTML = `<tr><td colspan="10" class="empty-state">No contacts matched this search. Try a larger radius, another suburb, or turn off the email-only filter.</td></tr>`;
      return;
    }
    tbodyEl.innerHTML = rows.map((r) => `
      <tr>
        <td>${esc(r.organisation_name)}</td>
        <td>${esc(r.category)}</td>
        <td>${esc(r.suburb)}</td>
        <td>${esc(r.postcode)}</td>
        <td>${esc(r.distance_km)}</td>
        <td>${r.public_email ? `<a href="mailto:${esc(r.public_email)}">${esc(r.public_email)}</a>` : ""}</td>
        <td>${r.phone ? `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>` : ""}</td>
        <td>${esc(r.address_line)}</td>
        <td class="link-stack">
          ${r.website_url ? `<a href="${esc(r.website_url)}" target="_blank" rel="noopener">Website</a>` : ""}
          ${r.source_url ? `<a href="${esc(r.source_url)}" target="_blank" rel="noopener">Source</a>` : ""}
        </td>
        <td>${esc(r.workshop_relevance)}</td>
      </tr>
    `).join("");
  }

  function renderDatasetStats() {
    const total = state.contacts.length;
    const categories = new Set(state.contacts.map((r) => r.category)).size;
    const emailCount = state.contacts.filter((r) => (r.public_email || "").trim()).length;
    const regional = new Set(state.contacts.map((r) => `${r.suburb}|${r.postcode}`)).size;

    datasetStatsEl.innerHTML = [
      { value: total, label: "NSW contacts loaded" },
      { value: categories, label: "categories covered" },
      { value: emailCount, label: "contacts with public email" },
      { value: regional, label: "suburb and postcode points" },
    ].map((item) => `<div class="stat"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></div>`).join("");
  }

  function runSearch() {
    errEl.textContent = "";
    copyMetaEl.textContent = "";
    metaEl.textContent = "";
    tableEl.hidden = true;
    copyBtn.disabled = true;
    state.lastRows = [];

    try {
      const center = resolveCenter(locationEl.value);
      const radiusKm = Number(radiusEl.value);
      const category = categoryEl.value;
      const emailOnly = emailOnlyEl.checked;
      const categoryLabel = category === "all" ? "all categories" : category;

      state.lastRows = state.contacts
        .filter((s) => (category === "all" ? true : String(s.category).toLowerCase() === category))
        .filter((s) => (emailOnly ? Boolean(String(s.public_email || "").trim()) : true))
        .map((s) => ({ ...s, distance_km: haversineKm(center.lat, center.lon, s.lat, s.lon) }))
        .filter((s) => s.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km)
        .map((r) => ({ ...r, distance_km: Number(r.distance_km.toFixed(2)) }));

      const uniqueEmails = new Set(state.lastRows.map((r) => (r.public_email || "").trim()).filter(Boolean)).size;
      metaEl.textContent = `${state.lastRows.length} contacts within ${radiusKm} km of ${center.label} (${categoryLabel}${emailOnly ? ", email only" : ""}). ${uniqueEmails} unique public email address(es) in results.`;
      copyBtn.disabled = !state.lastRows.some((r) => (r.public_email || "").trim().length > 0);
      renderRows(state.lastRows);
      tableEl.hidden = false;
    } catch (err) {
      errEl.textContent = err.message || "Search failed.";
    }
  }

  function clearSearch() {
    locationEl.value = "";
    categoryEl.value = "all";
    radiusEl.value = "50";
    emailOnlyEl.checked = false;
    metaEl.textContent = "";
    copyMetaEl.textContent = "";
    errEl.textContent = "";
    tbodyEl.innerHTML = "";
    tableEl.hidden = true;
    state.lastRows = [];
    copyBtn.disabled = true;
  }

  async function copyEmails() {
    const emails = [...new Set(state.lastRows.map((r) => (r.public_email || "").trim()).filter((x) => x.length > 0))];
    if (!emails.length) {
      copyMetaEl.textContent = "No public emails found in current result set.";
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join("\n"));
      copyMetaEl.textContent = `Copied ${emails.length} unique email address(es).`;
    } catch (_e) {
      copyMetaEl.textContent = "Clipboard copy failed in this browser context.";
    }
  }

  function initCategoryOptions() {
    const categories = [...new Set(state.contacts.map((r) => String(r.category || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    for (const c of categories) {
      const opt = document.createElement("option");
      opt.value = c.toLowerCase();
      opt.textContent = c;
      categoryEl.appendChild(opt);
    }
  }

  async function init() {
    const base = `./data/${stateCode}`;
    const [contacts, postcodes, suburbs] = await Promise.all([
      fetch(`${base}/contacts.min.json`).then((r) => r.json()),
      fetch(`${base}/postcode_centroids.min.json`).then((r) => r.json()),
      fetch(`${base}/suburb_centroids.min.json`).then((r) => r.json()),
    ]);

    state.contacts = contacts;
    state.postcodeCentroids = postcodes;
    state.suburbCentroids = suburbs;
    initCategoryOptions();
    renderDatasetStats();

    searchBtn.addEventListener("click", runSearch);
    clearBtn.addEventListener("click", clearSearch);
    copyBtn.addEventListener("click", copyEmails);
    locationEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch();
    });
  }

  init().catch((err) => {
    errEl.textContent = err.message || "Failed to load contact data.";
  });
})();
