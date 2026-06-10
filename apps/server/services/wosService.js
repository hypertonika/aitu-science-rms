const WOS_API_BASE = process.env.WOS_API_BASE || "https://api.clarivate.com/apis/wos";
const WOS_MAX_RECORDS = Number(process.env.WOS_IMPORT_MAX_RECORDS || 200);

function normalizeWosId(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/www\.webofscience\.com\/wos\/author\/record\//i, "")
    .replace(/^researcherid:\s*/i, "");
}

async function getWorksByWosId(wosId) {
  const researcherId = normalizeWosId(wosId);
  const apiKey = process.env.WOS_API_KEY || process.env.CLARIVATE_API_KEY;

  if (!researcherId) {
    const error = new Error("Web of Science ResearcherID is required");
    error.status = 400;
    throw error;
  }

  if (!apiKey) {
    const error = new Error("Web of Science API key is not configured");
    error.status = 501;
    throw error;
  }

  const works = [];
  let firstRecord = 1;
  let recordsFound = null;

  while (works.length < WOS_MAX_RECORDS && (recordsFound === null || firstRecord <= recordsFound)) {
    const usrQuery = (process.env.WOS_AUTHOR_QUERY_TEMPLATE || "AI=({id})").replace(
      "{id}",
      escapeWosQueryValue(researcherId)
    );
    const params = new URLSearchParams({
      databaseId: process.env.WOS_DATABASE_ID || "WOS",
      usrQuery,
      count: String(Math.min(100, WOS_MAX_RECORDS - works.length)),
      firstRecord: String(firstRecord),
      optionView: "FR",
      sortField: "PY+D",
    });

    const response = await fetch(`${WOS_API_BASE}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AITUScienceRMS/1.0",
        "X-ApiKey": apiKey,
      },
    });

    if (!response.ok) {
      const error = new Error(`Web of Science returned ${response.status}`);
      error.status = response.status === 404 ? 404 : 502;
      throw error;
    }

    const data = await response.json();
    const records = extractWosRecords(data);
    recordsFound = Number(data.QueryResult?.RecordsFound || recordsFound || records.length);
    works.push(...records.map((record) => transformWosRecord(record, researcherId)).filter(Boolean));

    if (records.length === 0) break;
    firstRecord += records.length;
  }

  return works;
}

function transformWosRecord(record, researcherId) {
  const title = findWosTitle(record, ["item", "item_title"]) || findWosTitle(record);
  if (!title) return null;

  const sourceTitle = findWosTitle(record, ["source", "source_title"]);
  const authors = extractWosAuthors(record);
  const year = getWosYear(record);
  const doi = findIdentifier(record, ["doi"]);
  const uid = record.UID || record.uid || "";

  return {
    title,
    authors,
    year,
    doi,
    journal: sourceTitle,
    output: sourceTitle || getWosPublisher(record),
    publicationType: "scopus_wos",
    citations: getWosCitations(record),
    source: "wos",
    importedFrom: `wos:${researcherId}`,
    externalUrl: uid ? `https://www.webofscience.com/wos/woscc/full-record/${uid}` : "",
    wos: true,
  };
}

function extractWosRecords(data = {}) {
  const records = data.Data?.Records?.records?.REC || data.Data?.Records?.records || data.Records?.records?.REC;
  if (Array.isArray(records)) return records;
  return records ? [records] : [];
}

function findWosTitle(record, preferredTypes = []) {
  const titles = asArray(record?.static_data?.summary?.titles?.title);
  const preferred = titles.find((title) => {
    const type = String(title?.type || "").toLowerCase();
    return preferredTypes.some((preferredType) => type === preferredType || type.includes(preferredType));
  });

  return getValue(preferred) || getValue(titles[0]);
}

function extractWosAuthors(record) {
  return asArray(record?.static_data?.summary?.names?.name)
    .filter((name) => !name.role || String(name.role).toLowerCase() === "author")
    .map((name) => name.display_name || name.full_name || name.wos_standard || name.last_name)
    .filter(Boolean)
    .join(", ");
}

function getWosYear(record) {
  return String(
    record?.static_data?.summary?.pub_info?.pubyear ||
      record?.static_data?.summary?.pub_info?.sortdate?.slice(0, 4) ||
      ""
  );
}

function getWosPublisher(record) {
  return getValue(record?.static_data?.summary?.publishers?.publisher?.names?.name);
}

function getWosCitations(record) {
  const entries = asArray(record?.dynamic_data?.citation_related?.tc_list?.silo_tc);
  const wosEntry = entries.find((entry) => String(entry.coll_id || "").toUpperCase() === "WOS");
  return Number(wosEntry?.local_count || entries[0]?.local_count || 0);
}

function findIdentifier(node, types) {
  if (!node || typeof node !== "object") return "";

  const nodeType = String(node.type || node.id_type || node.identifier_type || "").toLowerCase();
  if (types.includes(nodeType)) {
    const value = getValue(node.value || node.content || node._);
    if (value) return value;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findIdentifier(item, types);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findIdentifier(value, types);
      if (found) return found;
    }
  }

  return "";
}

function escapeWosQueryValue(value) {
  return String(value).replace(/[()"]/g, " ").trim();
}

function getValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return String(value.content || value.value || value._ || "").trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

module.exports = {
  getWorksByWosId,
  normalizeWosId,
};
