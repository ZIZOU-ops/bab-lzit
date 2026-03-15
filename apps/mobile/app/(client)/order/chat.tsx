import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChatScreenView } from '../../../src/components/chat/ChatScreenView';

export default function ClientChatScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  return <ChatScreenView orderId={params.orderId ?? ''} />;
}
