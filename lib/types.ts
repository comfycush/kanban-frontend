export type Role = "ADMIN" | "MEMBER";

export interface ApiMetaPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  timestamp: string;
  success: boolean;
  message: string;
  status: number;
  pagination?: ApiMetaPagination | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface UserPublic {
  id: string;
  email: string;
  createdAt?: string;
}

export interface LoginResponse {
  user: UserPublic;
  accessToken: string;
}

export type RegisterResponse = LoginResponse;

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  createdAt: string;
}

export interface MembershipWithOrg extends Membership {
  org: Organization;
}

export interface MembershipWithUser extends Membership {
  user: UserPublic;
}

export interface OrgWithMembershipsAndUsers extends Organization {
  memberships: MembershipWithUser[];
}

export interface Board {
  id: string;
  name: string;
  orgId: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  order: number;
  assignedToId: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  boardId: string;
  order: number;
  createdAt: string;
  cards?: Card[];
}

export interface BoardWithColumns extends Board {
  columns: Column[];
}

export interface Attachment {
  id: string;
  cardId: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface CardDetail extends Card {
  column?: Column & { board?: Board };
  assignedTo?: UserPublic | null;
  attachments?: Attachment[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface PrismaUpdateManyResult {
  count: number;
}

export interface ActivityLogItem {
  id: string;
  orgId: string;
  userId: string;
  cardId: string | null;
  type: string;
  data: Record<string, unknown> & { summary?: string };
  createdAt: string;
  user?: UserPublic;
  card?: { id: string; title: string } | null;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  orgId: string;
  createdAt: string;
}

export interface MessageWithUser extends Message {
  user: UserPublic;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateOrgDto {
  name: string;
}

export interface InviteUserDto {
  email: string;
  role?: Role;
}

export interface UpdateMemberRoleDto {
  role: Role;
}

export interface CreateBoardDto {
  name: string;
}

export interface UpdateBoardDto {
  name?: string;
}

export interface CreateColumnDto {
  name: string;
}

export interface UpdateColumnDto {
  name?: string;
}

export interface ReorderColumnsDto {
  columnIds: string[];
}

export interface CreateCardDto {
  title: string;
  description?: string;
  assignedToId?: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  assignedToId?: string | null;
}

export interface MoveCardDto {
  targetColumnId: string;
  newOrder: number;
}

export interface CreateMessageDto {
  content: string;
}
