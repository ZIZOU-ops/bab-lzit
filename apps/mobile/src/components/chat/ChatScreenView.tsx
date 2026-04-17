import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../providers/AuthProvider';
import { API_URL, POLL_INTERVAL_MS } from '../../constants/config';
import { colors, radius, shadows, spacing, textStyles } from '../../constants/theme';
import { BackHeader, LoadingScreen } from '../ui';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { NegotiationBar } from './NegotiationBar';
import { TypingIndicator } from './TypingIndicator';
import { useMessages } from '../../hooks/negotiation/useMessages';
import { useOffers } from '../../hooks/negotiation/useOffers';
import { useChatSocket } from '../../hooks/negotiation/useChatSocket';
import { useOrder } from '../../hooks/orders/useOrderQueries';
import { formatChatImageContent } from './messageContent';

function createClientMessageId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function ChatScreenView({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesQuery = useMessages(orderId, 30);
  const offersQuery = useOffers(orderId);
  const orderQuery = useOrder(orderId);
  const { socket, isConnected, typingUsers } = useChatSocket(orderId);
  const utils = trpc.useUtils();

  const sendMessageMutation = trpc.negotiation.sendMessage.useMutation({
    async onSuccess() {
      await utils.negotiation.messages.invalidate({ orderId, limit: 30 });
    },
  });

  const uploadChatImageMutation = trpc.negotiation.uploadChatImage.useMutation();

  const createOfferMutation = trpc.negotiation.createOffer.useMutation({
    async onSuccess() {
      await utils.negotiation.offers.invalidate({ orderId });
    },
  });

  const acceptOfferMutation = trpc.negotiation.acceptOffer.useMutation({
    async onSuccess() {
      await Promise.all([
        utils.negotiation.offers.invalidate({ orderId }),
        utils.order.byId.invalidate({ orderId }),
        utils.order.list.invalidate(),
      ]);
    },
  });

  const maxSeq = useMemo(
    () => messagesQuery.messages.reduce((current, message) => Math.max(current, message.seq), 0),
    [messagesQuery.messages],
  );

  const pollQuery = trpc.negotiation.poll.useQuery(
    {
      orderId,
      afterSeq: maxSeq,
    },
    {
      enabled: Boolean(orderId) && !isConnected,
      refetchInterval: POLL_INTERVAL_MS,
    },
  );

  useEffect(() => {
    if (!pollQuery.data) {
      return;
    }

    if (
      pollQuery.data.messages.length > 0 ||
      pollQuery.data.offers.length > 0 ||
      pollQuery.data.statusEvents.length > 0
    ) {
      void Promise.all([
        utils.negotiation.messages.invalidate({ orderId, limit: 30 }),
        utils.negotiation.offers.invalidate({ orderId }),
        utils.order.byId.invalidate({ orderId }),
        utils.order.list.invalidate(),
      ]);
    }
  }, [orderId, pollQuery.data, utils]);

  if (messagesQuery.isLoading || offersQuery.isLoading || orderQuery.isLoading) {
    return <LoadingScreen />;
  }

  const messages = [...messagesQuery.messages].reverse();
  const offers = offersQuery.data ?? [];
  const order = orderQuery.data;

  if (!order) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <BackHeader title={t('chat.orderChat')} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('chat.orderNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOfferFromOther = offers.find(
    (offer) =>
      offer.status === 'pending' &&
      (('senderId' in offer ? offer.senderId : offer.offeredBy) as string) !== user?.id,
  );

  const canNegotiate = order.status === 'negotiating';

  const sendChatContent = (content: string, options?: { clearInput?: boolean }) => {
    const nextContent = content.trim();
    if (!nextContent) {
      return;
    }

    if (options?.clearInput) {
      setInput('');
    }

    if (socket && isConnected) {
      socket.emit('typing:stop', { orderId });
    }

    const clientMessageId = createClientMessageId();

    if (socket && isConnected) {
      socket.emit('message:send', {
        orderId,
        content: nextContent,
        clientMessageId,
      });
      return;
    }

    sendMessageMutation.mutate({
      orderId,
      content: nextContent,
      clientMessageId,
    });
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('common.error'), t('chat.cameraPermissionDenied'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.45,
        cameraType: ImagePicker.CameraType.back,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert(t('common.error'), t('chat.imageUnavailable'));
        return;
      }

      const uploaded = await uploadChatImageMutation.mutateAsync({
        orderId,
        data: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });

      sendChatContent(formatChatImageContent(`${API_URL}${uploaded.path}`));
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('chat.imageUploadFailed');
      Alert.alert(t('common.error'), message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing['2xl'] * 2 + spacing.xs : 0}
    >
      <SafeAreaView edges={[]} style={styles.container}>
        <BackHeader
          title={t('chat.orderChat')}
        />

        <FlatList
          style={styles.list}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              content={item.content}
              createdAt={item.createdAt}
              isMine={item.senderId === user?.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
              void messagesQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            messagesQuery.isFetchingNextPage ? <ActivityIndicator color={colors.navy} /> : <TypingIndicator names={typingUsers} />
          }
        />

        {canNegotiate ? (
          <NegotiationBar
            floorPrice={order.floorPrice}
            pendingOfferFromOther={
              pendingOfferFromOther
                ? {
                    id: pendingOfferFromOther.id,
                    amount: pendingOfferFromOther.amount,
                  }
                : null
            }
            onSendOffer={(amount) => {
              if (isConnected && socket) {
                socket.emit('offer:create', { orderId, amount });
                return;
              }

              createOfferMutation.mutate({ orderId, amount });
            }}
            onAcceptOffer={() => {
              if (!pendingOfferFromOther) {
                return;
              }

              if (isConnected && socket) {
                socket.emit('offer:accept', {
                  orderId,
                  offerId: pendingOfferFromOther.id,
                });
                return;
              }

              acceptOfferMutation.mutate({
                orderId,
                offerId: pendingOfferFromOther.id,
              });
            }}
            isSending={createOfferMutation.isPending || acceptOfferMutation.isPending}
          />
        ) : null}

        <MessageInput
          value={input}
          onChangeText={setInput}
          onOpenCamera={() => {
            void openCamera();
          }}
          onTypingStart={() => {
            if (socket && isConnected) {
              socket.emit('typing:start', { orderId });
            }
          }}
          onTypingStop={() => {
            if (socket && isConnected) {
              socket.emit('typing:stop', { orderId });
            }
          }}
          onSend={() => {
            sendChatContent(input, { clearInput: true });
          }}
          disabled={sendMessageMutation.isPending || uploadChatImageMutation.isPending}
          isUploadingImage={uploadChatImageMutation.isPending}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...textStyles.body,
    color: colors.textSec,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerInfoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
});
