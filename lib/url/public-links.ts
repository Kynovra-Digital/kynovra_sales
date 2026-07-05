function cleanOrigin(origin: string) {
  return (origin || "http://localhost:3000").replace(/\/$/, "");
}

export function buildProductAttendanceLink(
  origin: string,
  productSlug: string,
) {
  return `${cleanOrigin(origin)}/a/${productSlug}`;
}

export function buildSalesRoomLink(origin: string, publicToken: string) {
  return `${cleanOrigin(origin)}/room/${publicToken}`;
}

export function buildSupportLink(origin: string) {
  return `${cleanOrigin(origin)}/suporte`;
}

export function buildStorefrontLink(origin: string) {
  return cleanOrigin(origin);
}

export function buildSupportRoomLink(origin: string, publicToken: string) {
  return `${cleanOrigin(origin)}/suporte/sala/${publicToken}`;
}
