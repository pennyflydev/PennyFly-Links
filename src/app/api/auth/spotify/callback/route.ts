import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { exchangeCode, getMe, saveToLibrary, followReleaseArtist, parseSpotifyTarget } from '@/lib/spotify'

function decodeState(state: string): { t: string; id: string; n: string } | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const code = req.nextUrl.searchParams.get('code')
  const stateRaw = req.nextUrl.searchParams.get('state')
  const oauthError = req.nextUrl.searchParams.get('error')

  const fail = (path = '/') => NextResponse.redirect(`${origin}${path}`)

  if (oauthError || !code || !stateRaw) return fail()

  const state = decodeState(stateRaw)
  const nonce = req.cookies.get('sp_oauth_nonce')?.value
  if (!state || !nonce || state.n !== nonce) return fail()

  const tokens = await exchangeCode(code)
  if (!tokens) return fail()

  const me = await getMe(tokens.access_token)
  if (!me) return fail()

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // Records the verified Spotify email into the artist's subscriber list.
  async function captureSubscriber(artistId: string, source: 'presave' | 'email_capture', sourceId: string) {
    if (!me!.email) return
    await supabase.from('subscribers').upsert(
      {
        artist_id: artistId,
        email: me!.email.toLowerCase(),
        source,
        source_id: sourceId,
        spotify_id: me!.id,
        country: me!.country ?? null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'artist_id,email', ignoreDuplicates: true }
    )
  }

  let redirectTo = '/'

  if (state.t === 'presave') {
    const { data: campaign } = await supabase
      .from('presave_campaigns')
      .select('id, slug, artist_id, spotify_url, release_date, save_count')
      .eq('id', state.id)
      .single()

    if (!campaign) return fail()

    await captureSubscriber(campaign.artist_id, 'presave', campaign.id)
    await supabase
      .from('presave_campaigns')
      .update({ save_count: (campaign.save_count ?? 0) + 1 })
      .eq('id', campaign.id)

    const target = parseSpotifyTarget(campaign.spotify_url)
    const released = campaign.release_date <= today

    if (target && released) {
      // Out already — save to library right now.
      await saveToLibrary(tokens.access_token, target.type, target.id)
      await followReleaseArtist(tokens.access_token, target.type, target.id)
    } else if (target) {
      // Not out yet — store the authorization for the release-day job.
      await supabase.from('spotify_presave_authorizations').upsert(
        {
          campaign_id: campaign.id,
          artist_id: campaign.artist_id,
          spotify_user_id: me.id,
          email: me.email ?? null,
          refresh_token: tokens.refresh_token,
          target_type: target.type,
          target_id: target.id,
          fulfilled: false,
        },
        { onConflict: 'campaign_id,spotify_user_id' }
      )
    }

    redirectTo = `/pre-save/${campaign.slug}?connected=1`
  } else if (state.t === 'link') {
    const { data: link } = await supabase
      .from('promo_links')
      .select('id, slug, artist_id, streaming_links(platform, url), artists!inner(slug)')
      .eq('id', state.id)
      .single()

    if (!link) return fail()

    await captureSubscriber(link.artist_id, 'email_capture', link.id)

    const spotifyLink = (link.streaming_links as { platform: string; url: string }[]).find((s) => s.platform === 'spotify')
    const target = parseSpotifyTarget(spotifyLink?.url)
    if (target) {
      await saveToLibrary(tokens.access_token, target.type, target.id)
      await followReleaseArtist(tokens.access_token, target.type, target.id)
    }

    // Send the fan to Spotify to actually listen.
    const artistRel = link.artists as unknown as { slug: string }
    const res = NextResponse.redirect(spotifyLink?.url ?? `${origin}/${artistRel.slug}/${link.slug}`)
    res.cookies.delete('sp_oauth_nonce')
    return res
  } else if (state.t === 'unlock') {
    // Follow-to-unlock: capture the email, then reveal the reward.
    const { data: item } = await supabase
      .from('exclusive_content')
      .select('id, artist_id, reward_url, is_active')
      .eq('id', state.id)
      .single()

    if (!item || !item.is_active) return fail()

    await captureSubscriber(item.artist_id, 'email_capture', item.id)

    const res = NextResponse.redirect(item.reward_url)
    res.cookies.delete('sp_oauth_nonce')
    return res
  }

  const res = NextResponse.redirect(`${origin}${redirectTo}`)
  res.cookies.delete('sp_oauth_nonce')
  return res
}
