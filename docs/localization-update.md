# Post Localization Update

## Overview
Updated the post components to support Traditional Chinese localization for dates, likes, and comments text.

## Changes Made

### 1. Translation Files Updated

**English (`locales/en.json`)**:
```json
"posts": {
  "like": "like",
  "likes": "likes",
  "comment": "comment", 
  "comments": "Comments",
  "viewAllComments": "View all {{count}} comments",
  "addComment": "Add a comment..."
},
"time": {
  "justNow": "just now",
  "minuteAgo": "{{count}} minute ago",
  "minutesAgo": "{{count}} minutes ago",
  // ... other time units
}
```

**Traditional Chinese (`locales/zh-Hant.json`)**:
```json
"posts": {
  "like": "個讚",
  "likes": "個讚",
  "comment": "則留言",
  "comments": "留言",
  "viewAllComments": "查看全部 {{count}} 則留言",
  "addComment": "新增留言..."
},
"time": {
  "justNow": "剛剛",
  "minuteAgo": "{{count}} 分鐘前",
  "minutesAgo": "{{count}} 分鐘前",
  // ... other time units
}
```

### 2. Components Updated

**PostItem Component (`components/PostItem.tsx`)**:
- Likes count: `{likeCount} {likeCount === 1 ? t('posts.like') : t('posts.likes')}`
- Comments header: `{t('posts.comments')}`
- View all comments: `{t('posts.viewAllComments', { count: comments.length })}`
- Comment placeholder: `placeholder={t('posts.addComment')}`
- Relative time: `{getRelativeTime(item.created_at, t)}`

**LocationPostsList Component (`components/LocationPostsList.tsx`)**:
- Relative time: `{getRelativeTime(item.created_at, t)}`

### 3. Utility Function Enhanced

**Time Utils (`utils/timeUtils.ts`)**:
- Updated `getRelativeTime()` function to accept translation function
- Maintains backward compatibility with fallback to English
- Supports proper pluralization for different languages

## Localized Text Examples

### English
- "5 likes"
- "Comments" 
- "View all 3 comments"
- "Add a comment..."
- "2 minutes ago"

### Traditional Chinese
- "5 個讚"
- "留言"
- "查看全部 3 則留言"
- "新增留言..."
- "2 分鐘前"

## Implementation Notes

1. **Pluralization**: Handled appropriately for both languages
2. **Backward Compatibility**: Old code without translation function still works
3. **Template Variables**: Used `{{count}}` for dynamic numbers
4. **Consistent Naming**: All post-related translations under `posts` namespace
5. **Time Localization**: Comprehensive time unit translations

## Testing

Test by:
1. Switching language to Traditional Chinese in settings
2. Viewing posts with likes and comments
3. Checking relative time displays
4. Adding comments to verify placeholder text

All post-related text should now display in the selected language!