import { z } from 'zod';
import type {
  authRenewPayload,
  messageSendPayload,
  offerAcceptPayload,
  offerCreatePayload,
  roomJoinPayload,
  roomLeavePayload,
  typingStartPayload,
  typingStopPayload,
} from '../schemas/socket/client-events';
import type {
  errorPayload,
  messageNewPayload,
  offerAcceptedPayload,
  offerNewPayload,
  statusUpdatePayload,
  typingIndicatorPayload,
} from '../schemas/socket/server-events';

export interface ClientToServerEvents {
  'room:join': (payload: z.infer<typeof roomJoinPayload>) => void;
  'room:leave': (payload: z.infer<typeof roomLeavePayload>) => void;
  'message:send': (payload: z.infer<typeof messageSendPayload>) => void;
  'offer:create': (payload: z.infer<typeof offerCreatePayload>) => void;
  'offer:accept': (payload: z.infer<typeof offerAcceptPayload>) => void;
  'typing:start': (payload: z.infer<typeof typingStartPayload>) => void;
  'typing:stop': (payload: z.infer<typeof typingStopPayload>) => void;
  'auth:renew': (payload: z.infer<typeof authRenewPayload>) => void;
}

export interface ServerToClientEvents {
  'message:new': (payload: z.infer<typeof messageNewPayload>) => void;
  'offer:new': (payload: z.infer<typeof offerNewPayload>) => void;
  'offer:accepted': (payload: z.infer<typeof offerAcceptedPayload>) => void;
  'typing:indicator': (payload: z.infer<typeof typingIndicatorPayload>) => void;
  'status:update': (payload: z.infer<typeof statusUpdatePayload>) => void;
  error: (payload: z.infer<typeof errorPayload>) => void;
}
