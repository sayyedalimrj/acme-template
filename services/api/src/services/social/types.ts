/**
 * Social provider abstraction — each platform implements publish/update/delete capabilities.
 */
export type SocialPlatform =
  | 'instagram'
  | 'telegram'
  | 'bale'
  | 'eitaa'
  | 'rubika'
  | 'whatsapp_business'
  | 'webhook'
  | 'website';

export interface SocialCapabilities {
  createPost: boolean;
  editPost: boolean;
  deletePost: boolean;
  uploadImage: boolean;
  publishStory: boolean;
  publishCarousel: boolean;
  publishProductCard: boolean;
}

export interface ProductPublishInput {
  productId: string;
  name: string;
  description?: string;
  price: string;
  currency: string;
  permalink?: string;
  imageUrls: string[];
}

export interface PublishResult {
  externalPostId?: string;
  externalPostUrl?: string;
  editSupported: boolean;
}

export interface SocialProvider {
  platform: SocialPlatform;
  getCapabilities(): SocialCapabilities;
  publishProduct(input: ProductPublishInput): Promise<PublishResult>;
  updatePublishedProduct(
    externalPostId: string,
    input: ProductPublishInput,
  ): Promise<PublishResult>;
  deleteOrArchivePublishedProduct(externalPostId: string): Promise<{ archived: boolean }>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

/** Default capabilities per platform (honest about edit/story limits). */
export function defaultCapabilities(platform: SocialPlatform): SocialCapabilities {
  const base = {
    createPost: true,
    editPost: false,
    deletePost: false,
    uploadImage: true,
    publishStory: false,
    publishCarousel: false,
    publishProductCard: true,
  };
  switch (platform) {
    case 'instagram':
      return { ...base, publishCarousel: true, publishStory: true, editPost: false };
    case 'telegram':
    case 'bale':
    case 'eitaa':
      return { ...base, editPost: true, deletePost: true };
    case 'webhook':
      return { ...base, editPost: true, deletePost: true, publishProductCard: true };
    default:
      return base;
  }
}

/** Manual/assisted provider — queues content; real API integration added per adapter later. */
export class ManualSocialProvider implements SocialProvider {
  constructor(
    public platform: SocialPlatform,
    private displayName: string,
  ) {}

  getCapabilities(): SocialCapabilities {
    return defaultCapabilities(this.platform);
  }

  async publishProduct(input: ProductPublishInput): Promise<PublishResult> {
    return {
      externalPostId: `manual-${this.platform}-${input.productId}-${Date.now()}`,
      externalPostUrl: input.permalink,
      editSupported: defaultCapabilities(this.platform).editPost,
    };
  }

  async updatePublishedProduct(
    externalPostId: string,
    input: ProductPublishInput,
  ): Promise<PublishResult> {
    return {
      externalPostId,
      externalPostUrl: input.permalink,
      editSupported: defaultCapabilities(this.platform).editPost,
    };
  }

  async deleteOrArchivePublishedProduct(_externalPostId: string): Promise<{ archived: boolean }> {
    return { archived: false };
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: `${this.displayName}: اتصال آزمایشی ثبت شد.` };
  }
}

export function providerForPlatform(platform: SocialPlatform, displayName: string): SocialProvider {
  if (platform === 'webhook') {
    return new ManualSocialProvider('webhook', displayName);
  }
  return new ManualSocialProvider(platform, displayName);
}
