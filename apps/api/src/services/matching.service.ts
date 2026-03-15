import type { Prisma, Professional, ServiceType } from '@prisma/client';
import type { Logger } from 'pino';
import type { PrismaClient } from '@prisma/client';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

type DbClient = Prisma.TransactionClient | PrismaClient;

function normalizeToken(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractZoneTokens(location: string) {
  return location
    .split(/[\s,-]+/g)
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

export async function matchPro(
  deps: Deps,
  order: {
    serviceType: ServiceType;
    location: string;
    detail?: {
      teamType?: string | null;
    } | null;
  },
  dbClient?: DbClient,
): Promise<Professional | null> {
  const db = dbClient ?? deps.db;

  let teamType = order.detail?.teamType?.toLowerCase() ?? null;

  if (!teamType) {
    const recentOrder = await db.order.findFirst({
      where: {
        serviceType: order.serviceType,
        location: order.location,
        status: { in: ['submitted', 'searching', 'negotiating'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        detail: {
          select: { teamType: true },
        },
      },
    });

    teamType = recentOrder?.detail?.teamType?.toLowerCase() ?? null;
  }

  const requireTeamLead = teamType === 'duo' || teamType === 'squad';
  const zoneTokens = extractZoneTokens(order.location);

  const prosBySkill = await db.professional.findMany({
    where: {
      isAvailable: true,
      ...(requireTeamLead ? { isTeamLead: true } : {}),
      skills: { has: order.serviceType },
    },
    orderBy: [{ reliability: 'desc' }, { rating: 'desc' }],
  });

  const zoneMatch = prosBySkill.find((pro) => {
    const normalizedZones = pro.zones.map((zone) => normalizeToken(zone));
    return normalizedZones.some((zone) => zoneTokens.includes(zone));
  });

  const selected = zoneMatch ?? prosBySkill[0] ?? null;

  if (selected) {
    deps.logger.info({ order, proId: selected.id }, 'Matched professional');
    return selected;
  }

  const fallback = await db.professional.findFirst({
    where: {
      isAvailable: true,
      ...(requireTeamLead ? { isTeamLead: true } : {}),
    },
    orderBy: [{ reliability: 'desc' }, { rating: 'desc' }],
  });

  if (fallback) {
    deps.logger.info({ order, proId: fallback.id }, 'Matched professional via fallback');
  }

  return fallback;
}
