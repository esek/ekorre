import { PrismaUtskott, PrismaPostType } from '@prisma/client'

export const posts = [
  {
    postname: 'Macapär',
    utskott: PrismaUtskott.INFU,
    postType: PrismaPostType.N,
    spots: 2,
    description: 'Informationschefslav',
    active: true,
    interviewRequired: false,
  },
  {
    postname: 'Teknokrat',
    utskott: PrismaUtskott.INFU,
    postType: PrismaPostType.N,
    spots: 3,
    description: 'Ljudperson',
    active: true,
    interviewRequired: false,
  },
  {
    postname: 'Cophös',
    utskott: PrismaUtskott.NOLLU,
    postType: PrismaPostType.N,
    spots: 5,
    description: 'Stressad',
    active: true,
    interviewRequired: true,
  }
]