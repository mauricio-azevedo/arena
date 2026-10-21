import { z } from 'zod';

// A member's role inside one group. Leaf file, imported by module files
// (profiles now, members from #295): a module importing another module for one
// enum invites a cycle.
export const groupMemberRoleSchema = z.enum(['ADMIN', 'MEMBER']);

export type GroupMemberRole = z.infer<typeof groupMemberRoleSchema>;
