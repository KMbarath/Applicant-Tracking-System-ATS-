export default function errorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : null))
      .filter(Boolean);
    if (messages.length) return messages.join('; ');
  }

  return fallback;
}
