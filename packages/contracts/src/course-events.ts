export const COURSE_EVENT_TYPES = {
  COURSE_PURCHASED: "COURSE_PURCHASED",
} as const;

export interface CoursePurchasedEvent {
  eventId: string;
  type: typeof COURSE_EVENT_TYPES.COURSE_PURCHASED;
  userId: string;
  courseId: string;
  enrollmentId: string;
  occurredAt: string;
}
