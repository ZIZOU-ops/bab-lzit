import { z } from 'zod';
import { AppError } from '../lib/errors';
import { protectedProcedure, router } from '../trpc';
import * as negotiationService from '../services/negotiation.service';

async function withAppErrorMapping<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AppError) {
      throw error.toTRPCError();
    }
    throw error;
  }
}

const messagesInput = z.object({
  orderId: z.string().uuid(),
  cursor: z.number().int().positive().optional(),
  beforeSeq: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const sendMessageInput = z.object({
  orderId: z.string().uuid(),
  content: z.string().max(2000),
  clientMessageId: z.string().uuid().optional(),
});

const offersInput = z.object({
  orderId: z.string().uuid(),
});

const createOfferInput = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
});

const acceptOfferInput = z.object({
  orderId: z.string().uuid(),
  offerId: z.string().uuid(),
});

const pollInput = z.object({
  orderId: z.string().uuid(),
  afterSeq: z.number().int().min(0).optional(),
});

export const negotiationRouter = router({
  messages: protectedProcedure.input(messagesInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      negotiationService.listMessages(
        { db: ctx.db, logger: ctx.logger },
        {
          orderId: input.orderId,
          userId: ctx.user.id,
          beforeSeq: input.beforeSeq ?? input.cursor,
          limit: input.limit,
        },
      ),
    ),
  ),

  sendMessage: protectedProcedure
    .input(sendMessageInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        negotiationService.sendMessage(
          { db: ctx.db, logger: ctx.logger },
          {
            orderId: input.orderId,
            userId: ctx.user.id,
            content: input.content,
            clientMessageId: input.clientMessageId,
          },
        ),
      ),
    ),

  offers: protectedProcedure.input(offersInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      negotiationService.listOffers(
        { db: ctx.db, logger: ctx.logger },
        {
          orderId: input.orderId,
          userId: ctx.user.id,
        },
      ),
    ),
  ),

  createOffer: protectedProcedure
    .input(createOfferInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        negotiationService.createOffer(
          { db: ctx.db, logger: ctx.logger },
          {
            orderId: input.orderId,
            userId: ctx.user.id,
            amount: input.amount,
          },
        ),
      ),
    ),

  acceptOffer: protectedProcedure
    .input(acceptOfferInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        negotiationService.acceptOffer(
          { db: ctx.db, logger: ctx.logger },
          {
            orderId: input.orderId,
            offerId: input.offerId,
            userId: ctx.user.id,
          },
        ),
      ),
    ),

  poll: protectedProcedure.input(pollInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      negotiationService.poll(
        { db: ctx.db, logger: ctx.logger },
        {
          orderId: input.orderId,
          userId: ctx.user.id,
          afterSeq: input.afterSeq,
        },
      ),
    ),
  ),
});
