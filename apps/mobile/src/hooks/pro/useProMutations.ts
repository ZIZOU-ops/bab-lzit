import { trpc } from '../../lib/trpc';

export function useToggleAvailability() {
  const utils = trpc.useUtils();

  return trpc.pro.toggleAvailability.useMutation({
    async onSettled() {
      await utils.pro.profile.invalidate();
    },
  });
}

export function useUpdateOrderStatus() {
  const utils = trpc.useUtils();

  return trpc.order.updateStatus.useMutation({
    async onSettled(_data, _error, input) {
      await Promise.all([
        utils.order.byId.invalidate({ orderId: input.orderId }),
        utils.order.list.invalidate(),
        utils.pro.orders.invalidate(),
      ]);
    },
  });
}

export function useCreateJoinRequest() {
  const utils = trpc.useUtils();

  return trpc.pro.createJoinRequest.useMutation({
    async onSettled() {
      await Promise.all([utils.pro.openSlots.invalidate(), utils.pro.orders.invalidate()]);
    },
  });
}

export function useApproveAssignment() {
  const utils = trpc.useUtils();

  return trpc.pro.approveAssignment.useMutation({
    async onSettled() {
      await utils.pro.joinRequests.invalidate();
    },
  });
}

export function useRejectAssignment() {
  const utils = trpc.useUtils();

  return trpc.pro.rejectAssignment.useMutation({
    async onSettled() {
      await utils.pro.joinRequests.invalidate();
    },
  });
}

export function useConfirmAssignment() {
  const utils = trpc.useUtils();

  return trpc.pro.confirmAssignment.useMutation({
    async onSettled() {
      await Promise.all([utils.pro.orders.invalidate(), utils.order.byId.invalidate()]);
    },
  });
}

export function useDeclineAssignment() {
  const utils = trpc.useUtils();

  return trpc.pro.declineAssignment.useMutation({
    async onSettled() {
      await Promise.all([utils.pro.orders.invalidate(), utils.order.byId.invalidate()]);
    },
  });
}
