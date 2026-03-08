export const PLAN = {
  FREE: "FREE",
  PRO: "PRO",
};

const PRO_KEYWORDS = ["pro", "premium", "paid", "active"];
const FREE_KEYWORDS = ["free", "trial", "basic", "demo"];

const normalizeString = (value) => {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
};

const matchByKeywords = (value, keywords) => {
  const normalized = normalizeString(value);
  return keywords.some((keyword) => normalized.includes(keyword));
};

const getNested = (obj, paths) => {
  for (const path of paths) {
    let current = obj;
    let valid = true;

    for (const key of path) {
      if (current == null || !(key in current)) {
        valid = false;
        break;
      }
      current = current[key];
    }

    if (valid) return current;
  }

  return undefined;
};

export const resolvePlanFromData = (data) => {
  if (!data || typeof data !== "object") return null;

  const directPlanValue = getNested(data, [
    ["plan"],
    ["planType"],
    ["userPlan"],
    ["licenseType"],
    ["license", "type"],
    ["subscription", "plan"],
    ["subscription", "name"],
    ["subscription", "tier"],
    ["membership", "plan"],
    ["membership", "tier"],
  ]);

  if (matchByKeywords(directPlanValue, PRO_KEYWORDS)) return PLAN.PRO;
  if (matchByKeywords(directPlanValue, FREE_KEYWORDS)) return PLAN.FREE;

  const statusValue = getNested(data, [
    ["licenseStatus"],
    ["subscription", "status"],
    ["membership", "status"],
  ]);

  if (matchByKeywords(statusValue, PRO_KEYWORDS)) return PLAN.PRO;
  if (matchByKeywords(statusValue, FREE_KEYWORDS)) return PLAN.FREE;

  const booleanProFlag = getNested(data, [
    ["isPro"],
    ["isPremium"],
    ["hasPro"],
    ["license", "isPro"],
    ["subscription", "isActive"],
    ["membership", "isActive"],
  ]);

  if (typeof booleanProFlag === "boolean") {
    return booleanProFlag ? PLAN.PRO : PLAN.FREE;
  }

  return null;
};

export const isProFromData = (data) => resolvePlanFromData(data) === PLAN.PRO;
