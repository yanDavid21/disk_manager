export const processBigInt = (bigint: bigint): string => {
  const KB_size = 1024;
  const MB_size = KB_size * 1024;
  const GB_size = MB_size * 1024;
  if (bigint < BigInt(KB_size)) {
    return `${bigint} bytes`;
  } else if (bigint < BigInt(MB_size)) {
    return `${(Number(bigint) / KB_size).toFixed(3)} KB`;
  } else if (bigint < BigInt(GB_size)) {
    return `${(Number(bigint) / MB_size).toFixed(3)} MB`;
  } else {
    const sizeInKB = Number(bigint / BigInt(KB_size));
    return `${(sizeInKB / MB_size).toFixed(3)} GB`;
  }
};