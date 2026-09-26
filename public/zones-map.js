// zones-map.js
//
// Shared multi-zone boundary map. Used by:
//   - zones-map.html   (public, no login, all active zones for an org)
//   - schedule-admin.html's Flex Zones tab (authenticated, org-scoped by token)
//
// Kept as one file specifically so the two surfaces can't drift out of sync
// with each other -- fix a rendering bug here once and both pick it up.
//
// Usage:
//   await renderZonesMap({
//     containerId: 'zonesMapEl',
//     apiBase: 'https://earnest-miracle-production-5a3a.up.railway.app',
//     orgSlug: 'aventurasjorge',   // optional -- omit when using an auth token instead
//     headers: { Authorization: 'Bearer ...' }, // optional
//     onZonesLoaded: (legend) => { ... },        // optional callback, see below
//   });
//
// Resolves to `legend`: an array of { zone, color, hasBoundary } in the same
// order the API returned zones, for building a matching color-coded list
// alongside the map.

(function () {
  const PALETTE = [
    '#1d4ed8', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4338ca',
    '#0d9488', '#be123c', '#4d7c0f', '#9333ea', '#0369a1',
    '#b45309', '#15803d', '#a21caf', '#0e7490', '#b91c1c',
  ];

  function colorFor(idx) {
    return PALETTE[idx % PALETTE.length];
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function parseBoundary(z) {
    let gj = z.boundary_geojson;
    if (typeof gj === 'string') {
      try { gj = JSON.parse(gj); } catch { gj = null; }
    }
    return gj || null;
  }

  window.renderZonesMap = async function renderZonesMap(opts) {
    const { containerId, apiBase, orgSlug, headers } = opts;
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`renderZonesMap: no element #${containerId}`);
    if (typeof L === 'undefined') throw new Error('renderZonesMap: Leaflet (L) is not loaded');

    // One map instance per container, reused across refreshes -- Leaflet
    // throws if you call L.map() twice on the same div.
    if (!el._zonesMapInstance) {
      el._zonesMapInstance = L.map(el).setView([41.0, -75.9], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(el._zonesMapInstance);
      el._zonesLayerGroup = L.layerGroup().addTo(el._zonesMapInstance);
    }
    const map = el._zonesMapInstance;
    el._zonesLayerGroup.clearLayers();
    setTimeout(() => map.invalidateSize(), 0);

    const qs = new URLSearchParams();
    if (orgSlug) qs.set('org_slug', orgSlug);
    const url = apiBase.replace(/\/$/, '') + '/v1/flex-zones' + (qs.toString() ? '?' + qs.toString() : '');
    const res = await fetch(url, { headers: headers || {} });
    if (!res.ok) throw new Error('Could not load flex zones: ' + res.statusText);
    const zones = await res.json();

    const legend = [];
    const boundsList = [];
    zones.forEach((z, i) => {
      const gj = parseBoundary(z);
      const color = colorFor(i);
      legend.push({ zone: z, color, hasBoundary: !!gj });
      if (!gj) return;
      const layer = L.geoJSON(gj, {
        style: { color, weight: 2, fillColor: color, fillOpacity: 0.18 },
      });
      layer.bindPopup(
        `<strong>${escapeHtml(z.zone_name)}</strong> (${escapeHtml(z.zone_code)})<br>` +
        (z.description ? escapeHtml(z.description) + '<br>' : '') +
        `Fare surcharge: $${Number(z.fare_surcharge || 0).toFixed(2)} &middot; ` +
        `Advance booking: ${z.advance_booking_minutes ?? 0} min`
      );
      layer.addTo(el._zonesLayerGroup);
      boundsList.push(layer.getBounds());
    });

    if (boundsList.length) {
      let combined = boundsList[0];
      for (let i = 1; i < boundsList.length; i++) combined = combined.extend(boundsList[i]);
      map.fitBounds(combined, { padding: [16, 16] });
    }

    if (typeof opts.onZonesLoaded === 'function') opts.onZonesLoaded(legend);
    return legend;
  };

  // Flies the shared map to one zone's bounds and opens its popup -- used by
  // both pages' legend-row click handlers so clicking a name jumps to its
  // shape without needing a second lookup.
  window.focusZoneOnMap = function focusZoneOnMap(containerId, zoneCode) {
    const el = document.getElementById(containerId);
    if (!el || !el._zonesLayerGroup) return;
    el._zonesLayerGroup.eachLayer((layer) => {
      const feature = layer.feature || (layer.toGeoJSON && layer.toGeoJSON());
      // Popups carry the zone's identity in their bound content; simplest
      // reliable match is against the popup HTML rather than re-parsing it.
      const popup = layer.getPopup && layer.getPopup();
      if (popup && popup.getContent().includes(`(${zoneCode})`)) {
        el._zonesMapInstance.fitBounds(layer.getBounds(), { padding: [24, 24] });
        layer.openPopup();
      }
    });
  };
})();
