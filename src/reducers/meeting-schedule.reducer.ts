import type { ScheduleSuggestions, ScheduleWithRelations } from '@api/meeting-schedule';
import { MeetingItemStatus, MeetingScheduleStatus } from '@generated/graphql';

export type MeetingScheduleResponse = {
  scheduledStart: Date | null;
  actualStart: Date | null;
  status: MeetingScheduleStatus;
  items: {
    position: number;
    number: string;
    title: string;
    description: string | null;
    plannedSeconds: number | null;
    actualStart: Date | null;
    actualSeconds: number | null;
    status: MeetingItemStatus;
    suggestedSeconds: number | null;
    posts: {
      position: number;
      name: string;
      spots: number | null;
      applicants: number | null;
      presentationSeconds: number;
      plannedSeconds: number | null;
      actualStart: Date | null;
      actualSeconds: number | null;
      status: MeetingItemStatus;
      suggestedSeconds: number | null;
      suggestedPresentationSeconds: number | null;
    }[];
  }[];
  breaks: {
    afterItemPosition: number;
    startAt: Date;
    endAt: Date;
    label: string | null;
  }[];
};

export function meetingScheduleReduce(
  schedule: ScheduleWithRelations,
  suggestions: ScheduleSuggestions,
): MeetingScheduleResponse {
  return {
    scheduledStart: schedule.scheduledStart,
    actualStart: schedule.actualStart,
    status: schedule.status as MeetingScheduleStatus,
    items: schedule.items.map((item, itemIndex) => ({
      position: item.position,
      number: item.number,
      title: item.title,
      description: item.description,
      plannedSeconds: item.plannedSeconds,
      actualStart: item.actualStart,
      actualSeconds: item.actualSeconds,
      status: item.status as MeetingItemStatus,
      suggestedSeconds: suggestions.items[itemIndex] ?? null,
      posts: item.posts.map((post, postIndex) => ({
        position: post.position,
        name: post.name,
        spots: post.spots,
        applicants: post.applicants,
        presentationSeconds: post.presentationSeconds,
        plannedSeconds: post.plannedSeconds,
        actualStart: post.actualStart,
        actualSeconds: post.actualSeconds,
        status: post.status as MeetingItemStatus,
        suggestedSeconds: suggestions.posts[itemIndex]?.[postIndex] ?? null,
        suggestedPresentationSeconds: suggestions.presentations[itemIndex]?.[postIndex] ?? null,
      })),
    })),
    breaks: schedule.breaks.map((meetingBreak) => ({
      afterItemPosition: meetingBreak.afterItemPosition,
      startAt: meetingBreak.startAt,
      endAt: meetingBreak.endAt,
      label: meetingBreak.label,
    })),
  };
}
