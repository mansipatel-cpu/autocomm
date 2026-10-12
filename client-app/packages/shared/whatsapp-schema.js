import { z } from "zod";

const jsonValue = z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.any()), z.array(z.any())]);

export const insertContactSchema = z.object({
    channelId: z.string().optional(),
    tenantId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().nullable().optional(),
    groups: jsonValue.optional(),
    tags: jsonValue.optional(),
    status: z.string().nullable().optional(),
    source: z.string().max(100).nullable().optional(),
    storeId: z.string().nullable().optional(),
    externalId: z.string().max(255).nullable().optional(),
    lastContact: z.coerce.date().nullable().optional(),
    updatedAt: z.coerce.date().nullable().optional(),
    createdBy: z.string().nullable().optional(),
});
