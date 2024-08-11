export const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const size = Math.abs(bytes);
  const index = Math.floor(Math.log(size) / Math.log(1024));
  const formattedSize = (size / 1024 ** index).toPrecision(3);
  return `${Math.sign(bytes) * Number(formattedSize)} ${units[index]}`;
};
