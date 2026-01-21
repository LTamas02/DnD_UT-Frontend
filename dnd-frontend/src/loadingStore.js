let pendingCount = 0;
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener(pendingCount));
};

export const startLoading = () => {
  pendingCount += 1;
  emit();
};

export const stopLoading = () => {
  pendingCount = Math.max(0, pendingCount - 1);
  emit();
};

export const subscribeLoading = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLoadingCount = () => pendingCount;
