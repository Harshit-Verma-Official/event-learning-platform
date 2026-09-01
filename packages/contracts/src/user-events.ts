import type { UserRole } from "./auth";

export const USER_EVENT_TYPES = {
  USER_CREATED: "USER_CREATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
} as const;

export type UserEventType =
  (typeof USER_EVENT_TYPES)[keyof typeof USER_EVENT_TYPES];

export interface UserCreatedEvent {
  eventId: string;
  type: typeof USER_EVENT_TYPES.USER_CREATED;
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  occurredAt: string;
}

export interface UserRoleChangedEvent {
  eventId: string;
  type: typeof USER_EVENT_TYPES.USER_ROLE_CHANGED;
  userId: string;
  role: UserRole;
  occurredAt: string;
}

export type UserEvent = UserCreatedEvent | UserRoleChangedEvent;
