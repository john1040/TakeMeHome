type TranslationFunction = (key: string, params?: { count?: number }) => string;

export const getRelativeTime = (dateString: string, t?: TranslationFunction): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Fallback to English if no translation function provided
  if (!t) {
    if (diffInSeconds < 60) {
      return 'just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }

  // Use translation function
  if (diffInSeconds < 60) {
    return t('time.justNow');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t(diffInMinutes === 1 ? 'time.minuteAgo' : 'time.minutesAgo', { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t(diffInHours === 1 ? 'time.hourAgo' : 'time.hoursAgo', { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t(diffInDays === 1 ? 'time.dayAgo' : 'time.daysAgo', { count: diffInDays });
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return t(diffInWeeks === 1 ? 'time.weekAgo' : 'time.weeksAgo', { count: diffInWeeks });
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return t(diffInMonths === 1 ? 'time.monthAgo' : 'time.monthsAgo', { count: diffInMonths });
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return t(diffInYears === 1 ? 'time.yearAgo' : 'time.yearsAgo', { count: diffInYears });
};