import { Search } from "@upstash/search";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { enrichDocumentWithTranslations } from "@/lib/enrich-search-data";

type Document = {
  id: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] === null || source[key] === undefined) {
      continue;
    }

    if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
      if (typeof target[key] === 'object' && !Array.isArray(target[key]) && target[key] !== null) {
        result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

function mergeDocuments(existing: Document, newDoc: Document): Document {
  const mergedContent = deepMerge(
    existing.content || {},
    newDoc.content || {}
  );

  const mergedMetadata = deepMerge(
    existing.metadata || {},
    newDoc.metadata || {}
  );

  return {
    id: existing.id || newDoc.id,
    content: mergedContent,
    metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
  };
}

async function fetchAllExistingDocuments(index: ReturnType<typeof Search.prototype.index>): Promise<Map<string, Document>> {
  const existingDocs = new Map<string, Document>();

  try {
    const searchResult = await index.search({
      query: "*",
      limit: 10000,
    });

    if (searchResult && Array.isArray(searchResult)) {
      for (const result of searchResult) {
        existingDocs.set(result.id, {
          id: result.id,
          content: result.content || {},
          metadata: result.metadata || {},
        });
      }
    }
  } catch (error) {
    console.warn("Could not fetch existing documents, proceeding with new data only:", error);
  }

  return existingDocs;
}

export async function POST() {
  try {
    const url = process.env.UPSTASH_SEARCH_REST_URL;
    const token = process.env.UPSTASH_SEARCH_REST_TOKEN;
    if (!url || !token) {
      return NextResponse.json(
        { success: false, error: "Missing Upstash credentials" },
        { status: 500 }
      );
    }
    const search = new Search({ url, token });
    const index = search.index("haalarikone-db");

    const existingDocs = await fetchAllExistingDocuments(index);

    const filePath = path.join(process.cwd(), "data", "overall_colors_upstash.json");
    const fileContents = await readFile(filePath, "utf-8");
    const newDocuments = JSON.parse(fileContents) as Document[];

    if (!Array.isArray(newDocuments)) {
      return NextResponse.json(
        { success: false, error: "Parsed JSON is not an array" },
        { status: 400 }
      );
    }

    const mergedDocuments: Document[] = [];

    for (const newDoc of newDocuments) {
      const existingDoc = existingDocs.get(newDoc.id);

      if (existingDoc) {
        const merged = mergeDocuments(existingDoc, newDoc);
        mergedDocuments.push(merged);
      } else {
        mergedDocuments.push(newDoc);
      }
    }

    for (const existingDoc of Array.from(existingDocs.values())) {
      if (!newDocuments.find(doc => doc.id === existingDoc.id)) {
        mergedDocuments.push(existingDoc);
      }
    }

    const enrichedDocuments = await Promise.all(
      mergedDocuments.map(enrichDocumentWithTranslations)
    );

    const batchSize = 100;
    let uploaded = 0;
    for (let i = 0; i < enrichedDocuments.length; i += batchSize) {
      const batch = enrichedDocuments.slice(i, i + batchSize);
      await index.upsert(batch);
      uploaded += batch.length;
    }

    return NextResponse.json({
      success: true,
      count: uploaded,
      batches: Math.ceil(uploaded / batchSize),
      existingCount: existingDocs.size,
      newCount: newDocuments.length,
      mergedCount: mergedDocuments.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
