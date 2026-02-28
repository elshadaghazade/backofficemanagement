import { z } from 'zod';

export const DashboardContentSchema = z.object({
  content: z.string().optional()
});

export type DashboardContentPayloadRequest = z.infer<typeof DashboardContentSchema>;
export type DashboardContentResponseType = {
    content: string;
}