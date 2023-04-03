import { OrbiActivityData, OrbiDepartment } from '@api/orbi';
import { Activity, UtskottInfo } from '@generated/graphql';

export const orbiActivityReduce = (activity: OrbiActivityData): Activity => {
  const {
    activityKey,
    departmentKey,
    title,
    description,
    shortlivedCoverImageUrl,
    startDate,
    endDate,
    location,
  } = activity;

  return {
    department: departmentKey,
    description: description,
    end: new Date(endDate),
    imageURL: shortlivedCoverImageUrl,
    key: activityKey,
    location: location.label,
    start: new Date(startDate),
    title: title,
  };
};

export const orbiDepartmentReduce = (department: OrbiDepartment): UtskottInfo => {
  const { name, social, about, shortlivedLogoUrl } = department;
  return {
    name: name,
    about: about,
    imageURL: shortlivedLogoUrl,
    socials: {
      facebook: social.facebookUrl,
      instagram: social.instagramUrl,
      twitter: social.twitterUrl,
      website: social.websiteUrl,
      youtube: social.youtubeUrl,
    },
  };
};
