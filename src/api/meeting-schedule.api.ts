/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { titleSimilarity } from '@/util/fuzzy';
import {
  MeetingItemStatus,
  MeetingScheduleStatus,
  MeetingType,
  type MeetingItemInput,
  type MeetingScheduleInput,
} from '@generated/graphql';
import {
  Prisma,
  PrismaMeetingBreak,
  PrismaMeetingItem,
  PrismaMeetingItemPost,
  PrismaMeetingItemStatus,
  PrismaMeetingSchedule,
  PrismaMeetingScheduleStatus,
  PrismaMeetingType,
} from '@prisma/client';

import prisma from './prisma';

export type ScheduleWithRelations = PrismaMeetingSchedule & {
  meeting: { type: PrismaMeetingType; date: Date };
  items: (PrismaMeetingItem & { posts: PrismaMeetingItemPost[] })[];
  breaks: PrismaMeetingBreak[];
};

export type ScheduleSuggestions = {
  items: (number | null)[];
  posts: (number | null)[][];
  presentations: (number | null)[][];
};

type SuggestionItem = {
  title: string;
  posts: { name: string; applicants: number | null; presentationSeconds: number }[];
};

type Sample = { x: number; y: number };

type Regression = { intercept: number; slope: number };

/** Ordinary least squares, skipped when there is too little/varying data. */
const fitLinear = (samples: Sample[]): Regression | null => {
  if (samples.length < 3) return null;

  const n = samples.length;
  const meanX = samples.reduce((sum, s) => sum + s.x, 0) / n;
  const meanY = samples.reduce((sum, s) => sum + s.y, 0) / n;
  let sxx = 0;
  let sxy = 0;

  samples.forEach(({ x, y }) => {
    sxx += (x - meanX) ** 2;
    sxy += (x - meanX) * (y - meanY);
  });

  if (sxx === 0) return null;

  const slope = sxy / sxx;
  return { intercept: meanY - slope * meanX, slope };
};

const predictLinear = (line: Regression, x: number): number =>
  Math.max(30, Math.round(line.intercept + line.slope * x));

/** Most recent sample by meeting date. */
const latestSample = <T extends { date: Date }>(samples: T[]): T | null =>
  samples.reduce<T | null>(
    (latest, sample) => (latest == null || sample.date > latest.date ? sample : latest),
    null,
  );

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const loadOf = (post: { applicants: number | null; presentationSeconds: number }): number =>
  post.applicants == null ? 0 : post.applicants * post.presentationSeconds;

const scheduleInclude = Prisma.validator<Prisma.PrismaMeetingScheduleInclude>()({
  meeting: { select: { type: true, date: true } },
  items: {
    orderBy: { position: 'asc' },
    include: { posts: { orderBy: { position: 'asc' } } },
  },
  breaks: { orderBy: { afterItemPosition: 'asc' } },
});

const toSecondsOrNull = (value: number | null | undefined): number | null =>
  value == null || value < 0 ? null : value;

const validateDate = (value: Date | null | undefined, field: string): Date | null => {
  if (value == null) return null;
  if (Number.isNaN(value.getTime())) {
    throw new BadRequestError(`${field} är inte ett giltigt datum`);
  }
  return value;
};

export class MeetingScheduleAPI {
  async getByMeetingId(meetingId: number): Promise<ScheduleWithRelations | null> {
    return prisma.prismaMeetingSchedule.findUnique({
      where: { refMeeting: meetingId },
      include: scheduleInclude,
    });
  }

  /**
   * Replaces the whole schedule for a meeting. A schedule is small (tens of
   * items), so replacing it keeps the API and the client simple.
   */
  async save(meetingId: number, input: MeetingScheduleInput): Promise<ScheduleWithRelations> {
    const meeting = await prisma.prismaMeeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });

    if (meeting == null) {
      throw new NotFoundError('Mötet kunde inte hittas');
    }

    if (input.items.some((item) => !item.title.trim())) {
      throw new BadRequestError('Alla punkter måste ha en titel');
    }

    const data: Prisma.PrismaMeetingScheduleCreateInput = {
      meeting: { connect: { id: meetingId } },
      scheduledStart: validateDate(input.scheduledStart, 'Starttid'),
      actualStart: validateDate(input.actualStart, 'Faktisk starttid'),
      status: (input.status ?? MeetingScheduleStatus.Draft) as PrismaMeetingScheduleStatus,
      items: {
        create: input.items.map((item, index) => this.itemCreateInput(item, index + 1)),
      },
      breaks: {
        create: input.breaks.map((meetingBreak) => ({
          afterItemPosition: meetingBreak.afterItemPosition,
          startAt: validateDate(meetingBreak.startAt, 'Pausstart') as Date,
          endAt: validateDate(meetingBreak.endAt, 'Pausslut') as Date,
          label: meetingBreak.label ?? null,
        })),
      },
    };

    if (input.breaks.some((b) => b.endAt <= b.startAt)) {
      throw new BadRequestError('En paus måste sluta efter att den börjar');
    }

    return prisma.$transaction(async (tx) => {
      await tx.prismaMeetingSchedule.deleteMany({ where: { refMeeting: meetingId } });
      return tx.prismaMeetingSchedule.create({ data, include: scheduleInclude });
    });
  }

  async remove(meetingId: number): Promise<boolean> {
    const result = await prisma.prismaMeetingSchedule.deleteMany({
      where: { refMeeting: meetingId },
    });

    return result.count > 0;
  }

  /**
   * Predicts item and post durations from previous meetings of the same type
   * (including the current one's already completed entries is not needed).
   */
  async getSuggestions(
    meetingType: MeetingType,
    meetingId: number,
    items: SuggestionItem[],
  ): Promise<ScheduleSuggestions> {
    const schedules = await prisma.prismaMeetingSchedule.findMany({
      where: {
        meeting: {
          type: meetingType as unknown as PrismaMeetingType,
          id: { not: meetingId },
        },
      },
      include: {
        meeting: { select: { date: true } },
        items: { include: { posts: true } },
      },
    });

    type PostSample = {
      name: string;
      date: Date;
      seconds: number;
      applicants: number | null;
      presentationSeconds: number;
    };
    type ItemSample = { title: string; date: Date; seconds: number };
    type PresentationSample = { name: string; date: Date; seconds: number };

    const postSamples: PostSample[] = [];
    const itemSamples: ItemSample[] = [];
    const presentationSamples: PresentationSample[] = [];
    const regressionPostSamples: Sample[] = [];
    const regressionItemSamples: Sample[] = [];

    schedules.forEach((schedule) => {
      const date = schedule.meeting.date;

      schedule.items.forEach((item) => {
        const itemLoad = item.posts.reduce((sum, post) => sum + loadOf(post), 0);

        if (item.actualSeconds != null) {
          itemSamples.push({ title: item.title, date, seconds: item.actualSeconds });
          if (itemLoad > 0) {
            regressionItemSamples.push({ x: itemLoad, y: item.actualSeconds });
          }
        }

        item.posts.forEach((post) => {
          presentationSamples.push({
            name: post.name,
            date,
            seconds: post.presentationSeconds,
          });

          if (post.actualSeconds != null) {
            postSamples.push({
              name: post.name,
              date,
              seconds: post.actualSeconds,
              applicants: post.applicants,
              presentationSeconds: post.presentationSeconds,
            });
            const postLoad = loadOf(post);
            if (postLoad > 0) {
              regressionPostSamples.push({ x: postLoad, y: post.actualSeconds });
            }
          }
        });
      });
    });

    const itemLine = fitLinear(regressionItemSamples);
    const postLine = fitLinear(regressionPostSamples);

    // Fallback for completely unknown names: median of the latest meeting.
    const lastMeeting = schedules.reduce<typeof schedules[number] | null>(
      (latest, schedule) =>
        latest == null || schedule.meeting.date > latest.meeting.date ? schedule : latest,
      null,
    );
    const lastMeetingPostMedian = median(
      (lastMeeting?.items ?? []).flatMap((item) =>
        item.posts.flatMap((post) => (post.actualSeconds == null ? [] : [post.actualSeconds])),
      ),
    );
    const lastMeetingItemMedian = median(
      (lastMeeting?.items ?? []).flatMap((item) =>
        item.actualSeconds == null ? [] : [item.actualSeconds],
      ),
    );

    const suggestItemBase = (item: SuggestionItem): number | null => {
      const matches = itemSamples
        .map((sample) => ({ ...sample, score: titleSimilarity(item.title, sample.title) }))
        .filter((sample) => sample.score >= 0.6);

      if (matches.length === 0) return lastMeetingItemMedian;

      const load = item.posts.reduce((sum, post) => sum + loadOf(post), 0);
      if (itemLine != null && load > 0) return predictLinear(itemLine, load);

      return latestSample(matches)?.seconds ?? lastMeetingItemMedian;
    };

    const suggestPost = (post: SuggestionItem['posts'][number]): number | null => {
      const matches = postSamples
        .map((sample) => ({ ...sample, score: titleSimilarity(post.name, sample.name) }))
        .filter((sample) => sample.score >= 0.6);

      if (matches.length === 0) return lastMeetingPostMedian;

      if (matches.length >= 3 && postLine != null && post.applicants != null) {
        return predictLinear(postLine, loadOf(post));
      }

      return latestSample(matches)?.seconds ?? lastMeetingPostMedian;
    };

    /** Latest manually entered presentation time for a matching post. */
    const suggestPresentation = (name: string): number | null => {
      const matches = presentationSamples
        .map((sample) => ({ ...sample, score: titleSimilarity(name, sample.name) }))
        .filter((sample) => sample.score >= 0.6);

      return latestSample(matches)?.seconds ?? null;
    };

    const postSuggestions = items.map((item) => item.posts.map(suggestPost));
    const itemSuggestions = items.map((item, index) => {
      const base = suggestItemBase(item);
      const postSum = postSuggestions[index].reduce<number>(
        (sum, seconds) => sum + (seconds ?? 0),
        0,
      );

      if (postSum === 0) return base;
      return Math.max(base ?? 0, postSum);
    });

    return {
      items: itemSuggestions,
      posts: postSuggestions,
      presentations: items.map((item) => item.posts.map((post) => suggestPresentation(post.name))),
    };
  }

  private itemCreateInput(
    item: MeetingItemInput,
    position: number,
  ): Prisma.PrismaMeetingItemCreateWithoutScheduleInput {
    return {
      position,
      number: item.number.trim(),
      title: item.title.trim(),
      description: item.description ?? null,
      plannedSeconds: toSecondsOrNull(item.plannedSeconds),
      actualStart: item.actualStart ?? null,
      actualSeconds: toSecondsOrNull(item.actualSeconds),
      status: (item.status ?? MeetingItemStatus.Pending) as PrismaMeetingItemStatus,
      posts: {
        create: item.posts.map((post, index) => ({
          position: index + 1,
          name: post.name.trim(),
          spots: post.spots ?? null,
          applicants: post.applicants ?? null,
          presentationSeconds: post.presentationSeconds ?? 120,
          plannedSeconds: toSecondsOrNull(post.plannedSeconds),
          actualStart: post.actualStart ?? null,
          actualSeconds: toSecondsOrNull(post.actualSeconds),
          status: (post.status ?? MeetingItemStatus.Pending) as PrismaMeetingItemStatus,
        })),
      },
    };
  }
}
