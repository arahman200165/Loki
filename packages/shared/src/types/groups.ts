// DB row shapes and API wire types for groups

export type GroupEventType =
  | 'member_joined'
  | 'member_left'
  | 'member_removed'
  | 'admin_transferred';

export interface GroupRow {
  id: string;
  admin_account_id: string;
  name: string;
  created_at: Date;
}

export interface GroupMemberRow {
  group_id: string;
  account_id: string;
  joined_at: Date;
}

export interface GroupEventRow {
  id: string;
  group_id: string;
  event_type: GroupEventType;
  actor_account_id: string;
  target_account_id: string | null;
  created_at: Date;
}

// POST /api/v1/groups/create
export interface CreateGroupRequest {
  name: string;
  member_public_ids: string[]; // 1–24 others; total group size 2–25 with admin
}

export interface CreateGroupResponse {
  group_id: string;
}

// GET /api/v1/groups/:id/members
export interface GroupMemberSummary {
  public_id: string;
  joined_at: string; // ISO-8601
  is_admin: boolean;
}

export interface GroupMembersResponse {
  members: GroupMemberSummary[];
}

// POST /api/v1/groups/:id/members/add
export interface AddGroupMemberRequest {
  public_id: string;
}

// POST /api/v1/groups/:id/members/remove
export interface RemoveGroupMemberRequest {
  public_id: string;
}

// POST /api/v1/groups/:id/leave
export interface LeaveGroupResponse {
  status: 'ok';
}
