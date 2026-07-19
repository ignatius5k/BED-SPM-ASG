const query = new URLSearchParams(window.location.search);
const mockPreference = query.get("mock");
const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname
);
const modulePath =
  mockPreference === "true" || (mockPreference !== "false" && isLocalPreview)
    ? "./food_stalls_preview.js?v=20260719b"
    : "./food_stalls.js";

import(modulePath);
