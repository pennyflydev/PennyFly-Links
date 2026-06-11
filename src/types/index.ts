export type UserRole = 'admin' | 'artist'

export type Plan = 'signed' | 'starter' | 'pro' | 'label' | 'enterprise'

export type Theme = 'minimal' | 'bold' | 'elegant' | 'neon'

export type ReleaseType = 'single' | 'album' | 'ep'

export type SubscriberSource = 'presave' | 'email_capture' | 'gate' | 'imported'

export type EmailProvider = 'aweber' | 'mailchimp' | 'klaviyo'

export type StreamingPlatform =
  | 'spotify'
  | 'apple_music'
  | 'youtube_music'
  | 'tidal'
  | 'amazon_music'
  | 'deezer'
  | 'bandcamp'
  | 'soundcloud'

export interface Profile {
  id: string
  clerk_user_id: string
  role: UserRole
  created_at: string
}

export interface Artist {
  id: string
  profile_id: string
  name: string
  slug: string
  bio: string | null
  genres: string[]
  profile_image_url: string | null
  cover_image_url: string | null
  background_type: 'theme' | 'gradient' | 'blur'
  theme: Theme
  is_signed: boolean
  plan: Plan
  custom_domain: string | null
  created_at: string
  updated_at: string
}

export interface PromoLink {
  id: string
  artist_id: string
  title: string
  artist_name: string | null
  subtitle: string | null
  release_type: ReleaseType
  cover_art_url: string | null
  slug: string
  is_published: boolean
  created_at: string
  streaming_links?: StreamingLink[]
}

export interface StreamingLink {
  id: string
  promo_link_id: string
  platform: StreamingPlatform
  url: string
  display_order: number
}

export interface PresaveCampaign {
  id: string
  artist_id: string
  title: string
  slug: string
  cover_image_url: string | null
  release_date: string
  spotify_url: string | null
  show_fan_counter: boolean
  description: string | null
  is_active: boolean
  created_at: string
  _count?: { subscribers: number }
}

export interface Subscriber {
  id: string
  artist_id: string
  email: string
  name: string | null
  source: SubscriberSource
  campaign_id: string | null
  created_at: string
}

export interface SocialLink {
  id: string
  artist_id: string
  platform: string
  url: string
  display_order: number
}

export interface ArtistPageSection {
  id: string
  artist_id: string
  section: 'bio' | 'links' | 'presave' | 'custom_links' | 'email_capture'
  display_order: number
  is_visible: boolean
}

export interface EmailIntegration {
  id: string
  artist_id: string
  provider: EmailProvider
  list_id: string | null
  is_active: boolean
  created_at: string
}

export interface OdesliResponse {
  entityUniqueId: string
  userCountry: string
  pageUrl: string
  linksByPlatform: {
    [key: string]: {
      country: string
      url: string
      entityUniqueId: string
      nativeAppUriMobile?: string
      nativeAppUriDesktop?: string
    }
  }
  entitiesByUniqueId: {
    [key: string]: {
      id: string
      type: string
      title?: string
      artistName?: string
      thumbnailUrl?: string
      thumbnailWidth?: number
      thumbnailHeight?: number
      apiProvider: string
      platforms: string[]
    }
  }
}
