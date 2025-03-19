interface TweetResult {
  rest_id: string;
  core: Core;
  unmention_data: Record<string, unknown>;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  legacy: Legacy;
  unmention_info: Record<string, unknown>;
}

interface Core {
  user_results: UserResults;
}

interface UserResults {
  result: UserResult;
}

interface UserResult {
  __typename: string;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: Record<string, unknown>;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: string;
  legacy: UserLegacy;
}

interface UserLegacy {
  can_dm: boolean;
  can_media_tag: boolean;
  created_at: string;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: Entities;
  fast_followers_count: number;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  needs_phone_verification: boolean;
  normal_followers_count: number;
  pinned_tweet_ids_str: string[];
  possibly_sensitive: boolean;
  profile_banner_url: string;
  profile_image_url_https: string;
  profile_interstitial_type: string;
  screen_name: string;
  statuses_count: number;
  translator_type: string;
  verified: boolean;
  want_retweets: boolean;
  withheld_in_countries: string[];
}

interface Entities {
  description: {
    urls: any[];
  };
}

interface EditControl {
  edit_tweet_ids: string[];
  editable_until_msecs: string;
  is_edit_eligible: boolean;
  edits_remaining: string;
}

interface Views {
  state: string;
}

interface Legacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: {
    hashtags: any[];
    symbols: any[];
    urls: any[];
    user_mentions: any[];
  };
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  in_reply_to_screen_name: string;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id_str: string;
  is_quote_status: boolean;
  lang: string;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
}

export interface CreateTweetResponse {
  data: {
    create_tweet: {
      tweet_results: {
        result: TweetResult;
      };
    };
  };
  errors: any[];
}
