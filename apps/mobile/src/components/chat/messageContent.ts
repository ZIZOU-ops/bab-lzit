const CHAT_IMAGE_PREFIX = '__babloo_image__:';

export function formatChatImageContent(url: string) {
  return `${CHAT_IMAGE_PREFIX}${url.trim()}`;
}

export function parseChatMessageContent(content: string) {
  if (content.startsWith(CHAT_IMAGE_PREFIX)) {
    return {
      type: 'image' as const,
      url: content.slice(CHAT_IMAGE_PREFIX.length),
    };
  }

  return {
    type: 'text' as const,
    text: content,
  };
}
