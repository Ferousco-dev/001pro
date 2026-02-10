import { Mention } from '../types';

/**
 * Extract @ mentions from text content
 * @param content The text content to parse
 * @returns Array of mentioned usernames (without @ symbol)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // Remove the @ symbol
  }

  // Remove duplicates
  return [...new Set(mentions)];
}

/**
 * Replace @ mentions in text with highlighted spans
 * @param content The text content
 * @param currentUserAlias The current user's alias to exclude from highlighting
 * @returns JSX-ready content with mentions highlighted
 */
export function highlightMentions(
  content: string,
  currentUserAlias?: string
): { text: string; mentions: string[] } {
  const mentions = extractMentions(content);

  // Replace @mentions with highlighted versions (for display)
  let highlightedContent = content;
  mentions.forEach(mention => {
    const mentionRegex = new RegExp(`@${mention}\\b`, 'g');
    const isCurrentUser = mention === currentUserAlias;
    const highlightClass = isCurrentUser
      ? 'text-purple-400 font-semibold'
      : 'text-blue-400 font-semibold';

    highlightedContent = highlightedContent.replace(
      mentionRegex,
      `<span class="${highlightClass}">@${mention}</span>`
    );
  });

  return {
    text: highlightedContent,
    mentions
  };
}

/**
 * Create mention objects for database storage
 * @param content The content containing mentions
 * @param postId The post ID (optional)
 * @param commentId The comment ID (optional)
 * @param mentionedByAlias The user who created the mention
 * @returns Array of mention objects
 */
export function createMentionObjects(
  content: string,
  mentionedByAlias: string,
  postId?: string,
  commentId?: string
): Omit<Mention, 'id' | 'createdAt'>[] {
  const mentionedUsers = extractMentions(content);

  return mentionedUsers.map(mentionedUserAlias => ({
    postId,
    commentId,
    mentionedUserAlias,
    mentionedByAlias,
    mentionType: postId ? 'post' : 'comment'
  }));
}

/**
 * Check if a mention notification should be created
 * @param mentionedUserAlias The user being mentioned
 * @param mentionedByAlias The user creating the mention
 * @returns boolean indicating if notification should be created
 */
export function shouldCreateMentionNotification(
  mentionedUserAlias: string,
  mentionedByAlias: string
): boolean {
  // Don't create notifications for self-mentions
  return mentionedUserAlias !== mentionedByAlias;
}

/**
 * Validate username format
 * @param username The username to validate
 * @returns boolean indicating if username is valid
 */
export function isValidUsername(username: string): boolean {
  // Username should be 3-30 characters, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}