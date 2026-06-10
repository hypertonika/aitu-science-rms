const ORCID_API_BASE = process.env.ORCID_API_BASE || "https://pub.orcid.org/v3.0";
const ORCID_OAUTH_BASE = process.env.ORCID_OAUTH_BASE || "https://orcid.org";
const ORCID_ID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;
let readPublicTokenPromise = null;

function normalizeOrcidId(value) {
  const id = String(value || "")
    .trim()
    .replace(/^https?:\/\/orcid\.org\//i, "")
    .replace(/^orcid:\s*/i, "")
    .toUpperCase();

  return ORCID_ID_PATTERN.test(id) ? id : "";
}

function buildOrcidAuthorizeUrl({ state, redirectUri }) {
  const clientId = process.env.ORCID_CLIENT_ID;
  if (!clientId || !redirectUri) {
    const error = new Error("ORCID OAuth is not configured");
    error.status = 501;
    throw error;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: process.env.ORCID_SCOPES || "/authenticate",
    redirect_uri: redirectUri,
    state,
  });

  return `${ORCID_OAUTH_BASE}/oauth/authorize?${params.toString()}`;
}

async function exchangeOrcidAuthorizationCode({ code, redirectUri }) {
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  if (!clientId || !clientSecret || !redirectUri) {
    const error = new Error("ORCID OAuth is not configured");
    error.status = 501;
    throw error;
  }

  const response = await fetch(`${ORCID_OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = new Error(`ORCID token exchange returned ${response.status}`);
    error.status = 502;
    throw error;
  }

  return response.json();
}

async function getWorksByOrcid(orcidId, accessToken) {
  const orcid = normalizeOrcidId(orcidId);
  if (!orcid) {
    const error = new Error("Valid ORCID iD is required");
    error.status = 400;
    throw error;
  }

  const worksSummary = await fetchOrcidJson(`${ORCID_API_BASE}/${orcid}/works`, accessToken);
  const summaries = extractPreferredWorkSummaries(worksSummary);
  if (summaries.length === 0) return [];

  const [detailsByPutCode, ownerName] = await Promise.all([
    fetchWorkDetails(orcid, summaries, accessToken),
    fetchOrcidOwnerName(orcid, accessToken).catch(() => ""),
  ]);

  return summaries
    .map((summary) =>
      transformOrcidWork(detailsByPutCode.get(String(summary["put-code"])) || summary, {
        fallbackSummary: summary,
        ownerName,
        orcid,
      })
    )
    .filter(Boolean);
}

async function fetchOrcidJson(url, accessToken) {
  const token = accessToken || process.env.ORCID_PUBLIC_ACCESS_TOKEN || (await getReadPublicAccessToken());
  const headers = {
    Accept: "application/vnd.orcid+json",
    "User-Agent": "AITUScienceRMS/1.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = new Error(`ORCID returned ${response.status}`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }

  return response.json();
}

async function getReadPublicAccessToken() {
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  if (!clientId || !clientSecret) return "";

  if (!readPublicTokenPromise) {
    readPublicTokenPromise = fetch(`${ORCID_OAUTH_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "/read-public",
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error(`ORCID read-public token request returned ${response.status}`);
          error.status = 502;
          throw error;
        }
        return response.json();
      })
      .then((data) => data.access_token || "");
  }

  return readPublicTokenPromise;
}

function extractPreferredWorkSummaries(worksSummary = {}) {
  return asArray(worksSummary.group)
    .map((group) => {
      const summaries = asArray(group?.["work-summary"]);
      if (summaries.length === 0) return null;
      return summaries
        .slice()
        .sort((left, right) => Number(right["display-index"] || 0) - Number(left["display-index"] || 0))[0];
    })
    .filter(Boolean);
}

async function fetchWorkDetails(orcid, summaries, accessToken) {
  const detailsByPutCode = new Map();
  const putCodes = summaries.map((summary) => summary["put-code"]).filter(Boolean);

  for (const chunk of chunkArray(putCodes, 100)) {
    try {
      const data = await fetchOrcidJson(`${ORCID_API_BASE}/${orcid}/works/${chunk.join(",")}`, accessToken);
      for (const work of extractBulkWorks(data)) {
        if (work?.["put-code"]) {
          detailsByPutCode.set(String(work["put-code"]), work);
        }
      }
    } catch (error) {
      console.error("ORCID work detail lookup failed:", error);
    }
  }

  return detailsByPutCode;
}

async function fetchOrcidOwnerName(orcid, accessToken) {
  const person = await fetchOrcidJson(`${ORCID_API_BASE}/${orcid}/person`, accessToken);
  const name = person?.name;
  const parts = [
    getValue(name?.["given-names"]),
    getValue(name?.["family-name"]),
  ].filter(Boolean);

  return parts.join(" ").trim() || getValue(name?.["credit-name"]);
}

function extractBulkWorks(data = {}) {
  if (Array.isArray(data.bulk)) {
    return data.bulk.map((item) => item?.work || item).filter(Boolean);
  }

  if (Array.isArray(data.work)) {
    return data.work;
  }

  return data["put-code"] ? [data] : [];
}

function transformOrcidWork(work, { fallbackSummary, ownerName, orcid }) {
  const summary = fallbackSummary || work;
  const title = getValue(work?.title?.title) || getValue(summary?.title?.title);
  const year = extractOrcidYear(work?.["publication-date"] || summary?.["publication-date"]);

  if (!title) return null;

  const externalIds = [
    ...asArray(summary?.["external-ids"]?.["external-id"]),
    ...asArray(work?.["external-ids"]?.["external-id"]),
  ];
  const doi = findExternalId(externalIds, "doi");
  const url = getValue(work?.url) || getValue(summary?.url) || findExternalUrl(externalIds);
  const authors = extractOrcidAuthors(work) || ownerName || "";
  const journal = getValue(work?.["journal-title"]) || getValue(summary?.["journal-title"]);

  return {
    title,
    authors,
    year,
    doi,
    journal,
    output: journal || getValue(work?.["short-description"]) || "",
    publicationType: mapOrcidWorkType(work?.type || summary?.type),
    citations: 0,
    source: "orcid",
    importedFrom: `orcid:${orcid}`,
    externalUrl: url,
  };
}

function extractOrcidAuthors(work = {}) {
  return asArray(work.contributors?.contributor)
    .map((contributor) => getValue(contributor?.["credit-name"]))
    .filter(Boolean)
    .join(", ");
}

function extractOrcidYear(publicationDate = {}) {
  return (
    getValue(publicationDate.year) ||
    getValue(publicationDate["media-date"]?.year) ||
    ""
  );
}

function findExternalId(externalIds, targetType) {
  const match = externalIds.find(
    (externalId) => String(externalId?.["external-id-type"] || "").toLowerCase() === targetType
  );

  return getValue(match?.["external-id-value"]);
}

function findExternalUrl(externalIds) {
  const match = externalIds.find((externalId) => getValue(externalId?.["external-id-url"]));
  return getValue(match?.["external-id-url"]);
}

function mapOrcidWorkType(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("conference") || normalized.includes("proceedings")) return "conference";
  if (normalized.includes("book")) return "books";
  if (normalized.includes("patent")) return "patents";
  return "articles";
}

function getValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return String(value.value || value.content || value._ || "").trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

module.exports = {
  buildOrcidAuthorizeUrl,
  exchangeOrcidAuthorizationCode,
  getWorksByOrcid,
  normalizeOrcidId,
};
