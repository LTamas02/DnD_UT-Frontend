const bookCache = new Map();

export const getCachedBookContent = (fileName) => {
  if (!fileName) return undefined;
  return bookCache.get(fileName);
};

export const setCachedBookContent = (fileName, content) => {
  if (!fileName || typeof content !== "string") return;
  bookCache.set(fileName, content);
};

export const hasCachedBookContent = (fileName) => {
  if (!fileName) return false;
  return bookCache.has(fileName);
};
