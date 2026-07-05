export const queryKeys = {
  aiSettings: {
    global: ["settings", "ai", "global"] as const,
  },
  audit: {
    logs: ["audit", "logs"] as const,
  },
  auth: {
    profile: ["auth", "profile"] as const,
  },
  campaigns: {
    list: ["campaigns", "list"] as const,
  },
  dashboard: {
    overview: (period = "today") => ["dashboard", "overview", period] as const,
  },
  hardness: {
    global: (organizationId: string) =>
      ["hardness", "global", organizationId] as const,
  },
  inventory: {
    list: ["inventory", "list"] as const,
  },
  modules: {
    record: (moduleKey: string) => ["modules", moduleKey] as const,
  },
  notifications: {
    list: ["notifications", "list"] as const,
  },
  products: {
    aiConfiguration: (productId: string) =>
      ["products", "ai-configuration", productId] as const,
    list: ["products", "list"] as const,
    qualification: ["products", "qualification"] as const,
    public: (slug: string) => ["products", "public", slug] as const,
    publicReviews: (slug: string) =>
      ["products", "public", slug, "reviews"] as const,
  },
  productCategories: {
    list: ["product-categories", "list"] as const,
  },
  publicRooms: {
    salesMessages: (token: string) =>
      ["public", "sales-room", token, "messages"] as const,
    sales: (token: string) => ["public", "sales-room", token] as const,
    supportMessages: (token: string) =>
      ["public", "support-room", token, "messages"] as const,
    support: (token: string) => ["public", "support-room", token] as const,
  },
  publicStorefront: {
    categories: ["public", "storefront", "categories"] as const,
    detail: ["public", "storefront"] as const,
  },
  sales: {
    messages: (sessionId: string) => ["sales", "messages", sessionId] as const,
    mine: ["sales", "mine"] as const,
    queue: ["sales", "queue"] as const,
  },
  settings: {
    general: ["settings", "general"] as const,
  },
  support: {
    messages: (sessionId: string) =>
      ["support", "messages", sessionId] as const,
    mine: ["support", "mine"] as const,
    queue: ["support", "queue"] as const,
  },
  team: {
    groups: ["team", "groups"] as const,
    members: ["team", "members"] as const,
  },
};
