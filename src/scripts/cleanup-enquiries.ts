import mongoose from "mongoose";
import dotenv from "dotenv";
import { EnquiryModel } from "../models/enquiry.model";

dotenv.config();

type EnquiryStatus = "NEW" | "IN_PROGRESS" | "COMPLETED";

type LeanEnquiry = {
  _id: mongoose.Types.ObjectId;
  full_name?: string;
  email?: string;
  mobile?: string;
  qualification?: string | null;
  background?: string | null;
  current_location?: string | null;
  interested_course?: string | null;
  interested_courses?: string[];
  last_interested_course?: string | null;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  status?: EnquiryStatus | string;
  enquiry_count?: number;
  last_enquired_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

function normalizeMobile(value: unknown): string {
  return normalizeString(value).replace(/\s+/g, "");
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => normalizeString(v)).filter(Boolean))];
}

function pickBestString(...values: Array<unknown>): string | null {
  for (const value of values) {
    const str = normalizeString(value);
    if (str) return str;
  }
  return null;
}

function normalizeStatus(statuses: Array<unknown>): EnquiryStatus {
  const normalized = statuses.map((s) => normalizeString(s).toUpperCase());

  if (normalized.includes("IN_PROGRESS")) return "IN_PROGRESS";
  if (normalized.includes("COMPLETED") || normalized.includes("CLOSED")) return "COMPLETED";
  return "NEW";
}

function getNewestDate(items: Array<unknown>): Date | null {
  const dates = items.map(toDate).filter((d): d is Date => !!d);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function getOldestDate(items: Array<unknown>): Date | null {
  const dates = items.map(toDate).filter((d): d is Date => !!d);
  if (!dates.length) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

function buildIdentityKeys(doc: LeanEnquiry): string[] {
  const keys: string[] = [];
  const email = normalizeEmail(doc.email);
  const mobile = normalizeMobile(doc.mobile);

  if (email) keys.push(`email:${email}`);
  if (mobile) keys.push(`mobile:${mobile}`);

  return keys;
}

async function cleanupEnquiries() {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("Missing MONGODB_URI or MONGO_URI in .env");
  }

  await mongoose.connect(mongoUrl);
  console.log("MongoDB connected");

  const allDocs = (await EnquiryModel.find().sort({ created_at: 1 }).lean()) as LeanEnquiry[];

  console.log(`Total enquiries found: ${allDocs.length}`);

  const visited = new Set<string>();
  const groups: LeanEnquiry[][] = [];
  const identityMap = new Map<string, LeanEnquiry[]>();

  for (const doc of allDocs) {
    const keys = buildIdentityKeys(doc);

    for (const key of keys) {
      const existing = identityMap.get(key) || [];
      existing.push(doc);
      identityMap.set(key, existing);
    }
  }

  for (const doc of allDocs) {
    const docId = String(doc._id);
    if (visited.has(docId)) continue;

    const queue: LeanEnquiry[] = [doc];
    const groupMap = new Map<string, LeanEnquiry>();

    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;

      const currentId = String(current._id);
      if (groupMap.has(currentId)) continue;

      groupMap.set(currentId, current);
      visited.add(currentId);

      const keys = buildIdentityKeys(current);

      for (const key of keys) {
        const related = identityMap.get(key) || [];
        for (const item of related) {
          const itemId = String(item._id);
          if (!groupMap.has(itemId)) {
            queue.push(item);
          }
        }
      }
    }

    groups.push([...groupMap.values()]);
  }

  console.log(`Grouped records: ${groups.length}`);

  let updatedCount = 0;
  let deletedCount = 0;
  let untouchedCount = 0;

  for (const group of groups) {
    if (group.length === 1) {
      const single = group[0];

      const currentCourses = uniqueStrings([
        ...(Array.isArray(single.interested_courses) ? single.interested_courses : []),
        normalizeString(single.interested_course),
      ]);

      const singleUpdate: Record<string, unknown> = {
        interested_courses: currentCourses,
        last_interested_course:
          currentCourses[currentCourses.length - 1] ||
          normalizeString(single.last_interested_course) ||
          normalizeString(single.interested_course) ||
          null,
        enquiry_count: Math.max(Number(single.enquiry_count || 1), 1),
      };

      if (normalizeString(single.status).toUpperCase() === "CLOSED") {
        singleUpdate.status = "COMPLETED";
      }

      await EnquiryModel.findByIdAndUpdate(single._id, singleUpdate, { new: true });
      untouchedCount++;
      continue;
    }

    const sortedByUpdated = [...group].sort((a, b) => {
      const aTime = toDate(a.updated_at)?.getTime() || 0;
      const bTime = toDate(b.updated_at)?.getTime() || 0;
      return bTime - aTime;
    });

    const primary = sortedByUpdated[0];
    const duplicates = sortedByUpdated.slice(1);

    const allCourses = uniqueStrings(
      group.flatMap((item) => [
        ...(Array.isArray(item.interested_courses) ? item.interested_courses : []),
        normalizeString(item.interested_course),
        normalizeString(item.last_interested_course),
      ])
    );

    const mergedFullName =
      pickBestString(
        ...sortedByUpdated.map((item) => item.full_name).filter(Boolean)
      ) || "Unknown";

    const mergedEmail =
      pickBestString(
        ...sortedByUpdated.map((item) => normalizeEmail(item.email)).filter(Boolean)
      ) || "";

    const mergedMobile =
      pickBestString(
        ...sortedByUpdated.map((item) => normalizeMobile(item.mobile)).filter(Boolean)
      ) || "";

    const mergedQualification = pickBestString(
      ...sortedByUpdated.map((item) => item.qualification)
    );

    const mergedBackground = pickBestString(
      ...sortedByUpdated.map((item) => item.background)
    );

    const mergedCurrentLocation = pickBestString(
      ...sortedByUpdated.map((item) => item.current_location)
    );

    const mergedSubject = pickBestString(
      ...sortedByUpdated.map((item) => item.subject)
    );

    const mergedMessage = pickBestString(
      ...sortedByUpdated.map((item) => item.message)
    );

    const mergedSource =
      pickBestString(...sortedByUpdated.map((item) => item.source)) || "website";

    const mergedStatus = normalizeStatus(group.map((item) => item.status));

    const latestUpdated = getNewestDate(group.map((item) => item.updated_at));
    const latestEnquired = getNewestDate([
      ...group.map((item) => item.last_enquired_at),
      ...group.map((item) => item.updated_at),
      ...group.map((item) => item.created_at),
    ]);

    const oldestCreated = getOldestDate(group.map((item) => item.created_at));

    const mergedEnquiryCount = group.reduce((sum, item) => {
      const count = Number(item.enquiry_count || 1);
      return sum + (Number.isFinite(count) && count > 0 ? count : 1);
    }, 0);

    const lastInterestedCourse =
      allCourses[allCourses.length - 1] ||
      pickBestString(...sortedByUpdated.map((item) => item.last_interested_course)) ||
      pickBestString(...sortedByUpdated.map((item) => item.interested_course)) ||
      null;

    const updatePayload: Record<string, unknown> = {
      full_name: mergedFullName,
      email: mergedEmail,
      mobile: mergedMobile,
      qualification: mergedQualification,
      background: mergedBackground,
      current_location: mergedCurrentLocation,
      interested_course: lastInterestedCourse,
      interested_courses: allCourses,
      last_interested_course: lastInterestedCourse,
      subject: mergedSubject,
      message: mergedMessage,
      source: mergedSource,
      status: mergedStatus,
      enquiry_count: mergedEnquiryCount,
      last_enquired_at: latestEnquired,
      updated_at: latestUpdated || new Date(),
    };

    if (oldestCreated) {
      updatePayload.created_at = oldestCreated;
    }

    await EnquiryModel.findByIdAndUpdate(primary._id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (duplicates.length) {
      await EnquiryModel.deleteMany({
        _id: { $in: duplicates.map((item) => item._id) },
      });
      deletedCount += duplicates.length;
    }

    updatedCount++;
    console.log(
      `Merged ${group.length} records -> kept ${String(primary._id)}, removed ${duplicates.length}`
    );
  }

  console.log("Cleanup completed");
  console.log({
    totalGroups: groups.length,
    updatedGroups: updatedCount,
    deletedDuplicates: deletedCount,
    normalizedSingles: untouchedCount,
  });

  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

cleanupEnquiries()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Cleanup failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });