export type UploadFileParams = {
  bucket: string;
  file: File;
  fileNamePrefix?: string;
  folder?: string;
};

export type GoogleOneTapClient = {
  accounts: {
    id: {
      initialize: (config: object) => void;
      prompt: () => void;
    };
  };
};

export type SupabaseLike = {
  auth: {
    signInWithIdToken: (args: {
      provider: "google";
      token: string;
    }) => Promise<{ error: { message: string } | null }>;
  };
};
