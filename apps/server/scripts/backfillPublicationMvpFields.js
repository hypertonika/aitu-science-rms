const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Publication = require("../models/Publication");
const { addNormalizedPublicationFields } = require("../services/publicationUtils");

dotenv.config();

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const publications = await Publication.find({});

  for (const publication of publications) {
    const normalized = addNormalizedPublicationFields(publication.toObject());
    publication.status = publication.status || "approved";
    publication.visibility = publication.visibility || "institutional";
    publication.source = publication.source || (publication.doi ? "manual" : "manual");
    publication.doiNormalized = normalized.doiNormalized || "";
    publication.titleNormalized = normalized.titleNormalized || "";
    publication.authorsNormalized = normalized.authorsNormalized || "";
    await publication.save();
  }

  console.log(`Backfilled ${publications.length} publications.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
