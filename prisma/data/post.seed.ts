import { PrismaUtskott, PrismaPostType } from '@prisma/client'

export const posts = [
  {
    slug: 'macapar',
    postname: 'Macapär',
    utskott: PrismaUtskott.INFU,
    postType: PrismaPostType.N,
    spots: 2,
    description: 'Informationschefslav',
    active: true,
    interviewRequired: false,
  },
  {
    slug: 'teknokrat',
    postname: 'Teknokrat',
    utskott: PrismaUtskott.INFU,
    postType: PrismaPostType.N,
    spots: 3,
    description: 'Ljudperson',
    active: true,
    interviewRequired: false,
  },
  {
    slug: 'cophos',
    postname: 'Cophös',
    utskott: PrismaUtskott.NOLLU,
    postType: PrismaPostType.N,
    spots: 5,
    description: 'Stressad',
    active: true,
    interviewRequired: true,
  }
]