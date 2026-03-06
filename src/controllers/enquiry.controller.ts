import { Request, Response } from "express";
import { EnquiryModel } from "../models/Enquiry";

export async function createEnquiry(req: Request, res: Response) {
  const doc = await EnquiryModel.create(req.body);
  res.status(201).json({ success: true, data: doc });
}

export async function listEnquiries(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const q = String(req.query.q || "").trim();
  const filter = q
    ? { $or: [{ full_name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }, { mobile: new RegExp(q, "i") }] }
    : {};

  const [items, total] = await Promise.all([
    EnquiryModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
    EnquiryModel.countDocuments(filter)
  ]);

  res.json({ success: true, data: { items, total, page, limit } });
}

export async function updateEnquiry(req: Request, res: Response) {
  const doc = await EnquiryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: doc });
}

export async function deleteEnquiry(req: Request, res: Response) {
  const doc = await EnquiryModel.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, message: "Deleted" });
}