import { AccessHistoryKind } from '@generated/graphql';
import prisma from './prisma';
import { PrismaPromise } from '@prisma/client';

export class AccessHistoryAPI {
    async log(refUser: string, historyKind: AccessHistoryKind, info: string): Promise<boolean> {
        await prisma.prismaAccessHistory.create({
            data: {
                historyKind: historyKind,
                refUser: refUser,
                info: info,
                timestamp: Date()               
            }
        })
        return true
    }
}