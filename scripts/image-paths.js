const DEFAULT_IMAGE = "Background/background.png";
const DEFAULT_HAWKER_IMAGE = "user_pages/hawker.jpg";

const HAWKER_CENTER_IMAGE_BY_ID = {
  "050335": DEFAULT_HAWKER_IMAGE,
  "069184": DEFAULT_HAWKER_IMAGE,
  "168898": DEFAULT_HAWKER_IMAGE,
  "390051": DEFAULT_HAWKER_IMAGE
};

const STALL_IMAGE_BY_NAME = {
  changjigourmet: "food_stall/chinatown_complex_market/chang_ji_gourmet.jpg",
  chickenricestall: "food_stall/maxwell _food_center/chicken rice stall.jpg",
  fuzhouoystercake: "food_stall/maxwell _food_center/maxwell_fuzhou_oyster_cake.jpg",
  hainanesechickenrice: "food_stall/maxwell _food_center/chicken rice stall.jpg",
  jianboshuihueh: "food_stall/tiong_bahru_market/jian_bo_shui_kueh.jpg",
  jianboshuikueh: "food_stall/tiong_bahru_market/jian_bo_shui_kueh.jpg",
  lianhebenjiclaypot: "food_stall/chinatown_complex_market/lian_he_ben_ji_claypot.jpg",
  lormee: "food_stall/tiong_bahru_market/lor_mee_178.jpg",
  lormee178: "food_stall/tiong_bahru_market/lor_mee_178.jpg",
  maxwellfuzhouoystercake: "food_stall/maxwell _food_center/maxwell_fuzhou_oyster_cake.jpg",
  namsinghokkienmee: "food_stall/old_airport_road_food_center/nam_sing_hokkien_mee.jpg",
  shinokaya: "food_stall/chinatown_complex_market/Shin Okaya.png",
  shuikueh: "food_stall/tiong_bahru_market/jian_bo_shui_kueh.jpg",
  supershioknasilemak: "food_stall/old_airport_road_food_center/Super Shiok Nasi Lemak.jpg",
  tastefusionhainanesechickenchop: "food_stall/maxwell _food_center/taste_fusion_hiananese_chicken_chop.jpg",
  tastefusionhiananesechickenchop: "food_stall/maxwell _food_center/taste_fusion_hiananese_chicken_chop.jpg",
  tiongbahrufriedkwayteow: "food_stall/tiong_bahru_market/tiong_bahru_fried_kway_teow.JPG",
  wangwangcrispycurrypuff: "food_stall/old_airport_road_food_center/wang_wang_crispy_curry_puff.jpg",
  westernstall: "food_stall/tiong_bahru_market/Western Stall.jpg",
  woojicookedfood: "food_stall/chinatown_complex_market/woo_ji_cooked_food.jpg",
  xinmeixianglormee: "food_stall/old_airport_road_food_center/xin_mei_xiang_lor_mee.jpg",
  zhenzhenporridge: "food_stall/maxwell _food_center/zhen_zhen_porridge.jpg"
};

const STALL_FALLBACK_BY_CENTER_ID = {
  "050335": "food_stall/chinatown_complex_market/woo_ji_cooked_food.jpg",
  "069184": "food_stall/maxwell _food_center/chicken rice stall.jpg",
  "168898": "food_stall/tiong_bahru_market/lor_mee_178.jpg",
  "390051": "food_stall/old_airport_road_food_center/nam_sing_hokkien_mee.jpg"
};

const PROMOTION_FALLBACKS = [
  "promotion/Dish1.jpg",
  "promotion/dish2.jpg"
];

function keyFor(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function hasUsablePath(value) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim().toLowerCase();
  return Boolean(trimmed) && !["undefined", "null", "none", "n/a", "na"].includes(trimmed);
}

function isExternalPath(value) {
  return /^(?:https?:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value);
}

export function normalizeImagePath(imagePath, fallback = DEFAULT_IMAGE) {
  const raw = hasUsablePath(imagePath) ? imagePath.trim() : fallback;

  if (!hasUsablePath(raw)) {
    return DEFAULT_IMAGE;
  }

  if (isExternalPath(raw)) {
    return raw;
  }

  let normalized = raw
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\/+/, "");

  let previous;
  do {
    previous = normalized;
    normalized = normalized.replace(/^(?:assets|images|public)\//i, "");
  } while (normalized !== previous);

  return normalized
    .replace(/^background\//i, "Background/")
    .replace(/^payment\//i, "Payment/")
    .replace(/^promotion\/dish1\.jpg$/i, "promotion/Dish1.jpg")
    .replace(/^food_stall\/maxwell_food_center\//i, "food_stall/maxwell _food_center/");
}

export function resolveHawkerCenterImage(id, name, imagePath) {
  const fallback = HAWKER_CENTER_IMAGE_BY_ID[String(id)] || DEFAULT_HAWKER_IMAGE;
  return normalizeImagePath(imagePath, fallback);
}

export function resolveStallImage(centerId, name, imagePath) {
  const fallback =
    STALL_IMAGE_BY_NAME[keyFor(name)] ||
    STALL_FALLBACK_BY_CENTER_ID[String(centerId)] ||
    DEFAULT_HAWKER_IMAGE;

  return normalizeImagePath(imagePath, fallback);
}

export function resolveProductImage(centerId, stallName, productName, imagePath, stallImagePath) {
  const fallback = resolveStallImage(centerId, stallName || productName, stallImagePath);
  return normalizeImagePath(imagePath, fallback);
}

export function resolvePromotionImage(code, description, imagePath) {
  const key = keyFor(`${code} ${description}`);
  const fallback = PROMOTION_FALLBACKS[key.length % PROMOTION_FALLBACKS.length];

  return normalizeImagePath(imagePath, fallback);
}

function escapeCssUrl(path) {
  return path.replace(/'/g, "\\'");
}

function cardBackground(path) {
  return `
    linear-gradient(to top right, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.8), rgba(3, 8, 31, 0.0), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    linear-gradient(to left, rgba(3, 8, 31, 1), rgba(3, 8, 31, 0.4), rgba(3, 8, 31, 0.2), rgba(3, 8, 31, 0), rgba(3, 8, 31, 0)),
    url('${escapeCssUrl(path)}') no-repeat center center / cover`;
}

export function setImageBackground(element, imagePath, fallback = DEFAULT_IMAGE) {
  const fallbackPath = normalizeImagePath(fallback, DEFAULT_IMAGE);
  const nextPath = normalizeImagePath(imagePath, fallbackPath);

  element.style.background = cardBackground(fallbackPath);

  if (nextPath === fallbackPath || isExternalPath(nextPath)) {
    element.style.background = cardBackground(nextPath);
    return;
  }

  const probe = new Image();
  probe.onload = () => {
    element.style.background = cardBackground(nextPath);
  };
  probe.onerror = () => {
    element.style.background = cardBackground(fallbackPath);
  };
  probe.src = nextPath;
}

export function setImageSrc(element, imagePath, fallback = DEFAULT_IMAGE) {
  const fallbackPath = normalizeImagePath(fallback, DEFAULT_IMAGE);
  const nextPath = normalizeImagePath(imagePath, fallbackPath);

  element.onerror = () => {
    element.onerror = null;
    element.src = fallbackPath;
  };
  element.src = nextPath;
}
