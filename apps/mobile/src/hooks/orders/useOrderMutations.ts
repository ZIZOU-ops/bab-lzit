import { trpc } from '../../lib/trpc';

export function useCreateOrder() {
  const utils = trpc.useUtils();

  return trpc.order.create.useMutation({
    async onSuccess(createdOrder) {
      await utils.order.byId.invalidate({ orderId: createdOrder.id });
      await utils.order.list.invalidate();
    },
  });
}

export function useCancelOrder() {
  const utils = trpc.useUtils();

  return trpc.order.cancel.useMutation({
    async onMutate(input) {
      await utils.order.byId.cancel({ orderId: input.orderId });

      const previousOrder = utils.order.byId.getData({ orderId: input.orderId });

      utils.order.byId.setData({ orderId: input.orderId }, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: 'cancelled',
        };
      });

      return { previousOrder };
    },
    onError(_error, input, context) {
      if (!context?.previousOrder) {
        return;
      }
      utils.order.byId.setData({ orderId: input.orderId }, context.previousOrder);
    },
    async onSettled(_data, _error, input) {
      await utils.order.byId.invalidate({ orderId: input.orderId });
      await utils.order.list.invalidate();
    },
  });
}

export function useRateOrder() {
  const utils = trpc.useUtils();

  return trpc.order.rate.useMutation({
    async onSettled(_data, _error, input) {
      await utils.order.byId.invalidate({ orderId: input.orderId });
      await utils.order.list.invalidate();
    },
  });
}
