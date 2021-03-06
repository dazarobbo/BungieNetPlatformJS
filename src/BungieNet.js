/*eslint camelcase: "off"*/

import "babel-polyfill";
import Platform from "./Platform.js";
import Plugin from "./Plugin.js";
import URI from "urijs";
import winston from "winston";

/**
 * BungieNet
 */
export default class BungieNet {

  /**
   * @return {URI} Gets the base bungie.net URI
   */
  static get base() {
    return new URI({
      protocol: BungieNet.scheme,
      hostname: BungieNet.host
    });
  }

  /**
   * @return {String} Fully qualified hostname
   */
  static get host() {
    return `www.${ BungieNet.domain }`;
  }

  /**
   * @return {Promise.<URI>} Generates most appropriate locale-aware base URI
   */
  static async getLocaleBase() {
    const loc = await BungieNet.getLocale();
    return BungieNet.base.segment(loc);
  }

  /**
   * @return {URI} Base platform URI
   */
  static get platformPath() {
    return BungieNet.base.segment("Platform");
  }

  /**
   * Find the most appropriate locale to use
   * @return {Promise.<String>} locale
   */
  static getLocale() {
    return BungieNet.defaultLocale;
  }

}

/**
 * @type {String}
 */
BungieNet.defaultLocale = "en";

/**
 * @type {String}
 */
BungieNet.scheme = "https";

/**
 * @type {String}
 */
BungieNet.domain = "bungie.net";

/**
 * Enumerations from bungie.net
 * @type {Object}
 */
BungieNet.enums = {

  aclEnum: {
    none: 0,
    bnext_forum_ninja: 1,
    bnext_unlimited_groups: 2,
    bnext_founder_in_all_groups: 3,
    bnext_bungie_gold: 4,
    bnext_ninja_colors: 5,
    bnext_make_official_topics: 6,
    bnext_make_ninja_topics: 7,
    bnext_delete_forum_topics: 8,
    bnext_overturn_reports: 9,
    bnext_browse_reports: 10,
    bnext_global_ignore: 11,
    bnext_edit_any_public_post: 12,
    bnext_edit_users: 13,
    bnext_ultra_ban: 14,
    bnext_forum_mentor: 15,
    tiger_ban: 16,
    bnext_forum_curator: 17,
    bnext_big_likes: 18,
    bnext_player_support: 19,
    bnext_pin_topics: 20,
    bnext_lock_topics: 21,
    bnext_community_content_curator: 22,
    bnext_admin_history: 23,
    bnext_private_user_data_reader: 24,
    bnext_diagnostics_data_reader: 25,
    bnext_override_link_privacy: 26,
    bnext_discount_support: 27,
    bnext_application_supervision: 28
  },

  activityAggregationType: {
    none: 0,
    activities: 1,
    followers: 2
  },

  activityItemOrigin: {
    undetermined: -1,
    followed_group: 0,
    followed_user: 1,
    activities_about_me: 2,
    my_activities: 3
  },

  activityOutputFormat: {
    bnet: 0,
    plain: 1,
    custom: 2
  },

  activityQueryFilter: {
    all: 0,
    friends: 1,
    followers: 2,
    groups: 3,
    mine: 4,
    tags: 5,
    clans: 6
  },

  activityStatus: {
    processing: 0,
    failed: 1,
    skipped: 2,
    complete: 3
  },

  activityType: {
    none: -1,
    create: 0,
    edit: 1,
    delete: 2,
    rate: 3,
    follow: 4,
    unfollow: 5,
    apply: 6,
    rescind: 7,
    approve: 8,
    deny: 9,
    kick: 10,
    edit_membership_type: 11,
    like: 12,
    unlike: 13,
    share: 14,
    tagged_group: 15,
    tagged_topic: 16,
    avatar_changed: 17,
    display_name_changed: 18,
    title_changed: 19,
    title_unlocked: 20,
    group_topic_create: 21,
    group_reply_create: 22,
    reply: 23,
    change_group_name: 24,
    group_alliance_rejected: 26,
    group_alliance_approved: 27,
    group_alliance_broken: 28,
    transferFromVault: 1,
    transferToVault: 1001,
    trackQuest: 1002,
    untrackQuest: 1003,
    equipItem: 1004,
    buyItem: 1005,
    lockItem: 1008,
    unlockItem: 1009,
    refundItem: 1010,
    authorize: 2,
    revoke: 2001
  },

  adminHistoryItemFlags: {
    none: 0
  },

  adminHistoryMembershipFlags: {
    none: 0,
    bungie: 1,
    playerSupport: 2,
    mentor: 4,
    ninja: 8,
    groupAdmin: 16,
    groupFounder: 32,
    founderInAllGroups: 64
  },

  adminHistoryType: {
    none: 0,
    forum_post_ban: 2,
    user_ban: 2,
    user_warning: 3,
    forum_topic_post: 4,
    forum_reply: 5,
    mark_as_answer: 6,
    user_profile_edit: 7,
    unmark_as_answer: 8,
    community_content_approved: 9,
    community_content_rejected: 10,
    group_post_ban: 11,
    forum_post_unban: 12,
    tag_alias: 13,
    tag_unalias: 14,
    group_profile_ban: 15,
    forum_post_edit: 16,
    edited_player_support_flags: 17,
    edited_player_support_text: 18,
    group_settings_edit: 19,
    group_founder_change: 20,
    group_member_promotion_to_admin: 21,
    group_admin_demotion_to_member: 22,
    group_kick_ban: 23,
    group_kick: 24,
    group_unban: 25,
    forum_delete_topic: 26,
    user_profile_ban: 27,
    user_message_ban: 28,
    group_wall_moderate: 29,
    group_wall_ban: 30
  },

  affectedItemType: {
    none: -1,
    user: 0,
    post: 1,
    topic: 2,
    group: 3,
    tag: 4,
    community_content: 5,
    destiny: 6,
    application: 7
  },

  apiKeyStatus: {
    none: 0,
    active: 1,
    disabled: 2,
    deleted: 3
  },

  applicationScopes: {
    read_basic_user_profile: 1,
    read_groups: 2,
    write_groups: 4,
    admin_groups: 8,
    bnet_write: 16,
    move_equip_destiny_items: 32,
    read_destiny_inventory_and_vault: 64,
    read_user_data: 128,
    edit_user_data: 256,
    read_destiny_vendors_and_advisors: 512
  },

  applicationStatus: {
    none: 0,
    private: 1,
    public: 2,
    disabled: 3,
    blocked: 4
  },

  authorizationStatus: {
    none: 0,
    active: 1,
    revoked: 2
  },

  bnetAccountPrivacy: {
    default: 0,
    show_destiny_inventory: 1,
    hide_destiny_activity_history_feed: 2,
    hide_destiny_advisors: 4,
    hide_followers: 8
  },

  bucketCategory: {
    invisible: 0,
    item: 1,
    currency: 2,
    equippable: 3,
    ignored: 4
  },

  bucketScope: {
    character: 0,
    account: 1
  },

  bungieCredentialType: {
    none: 0,
    xuid: 1,
    psnid: 2,
    wlid: 3,
    fake: 4,
    facebook: 5,
    google: 8,
    windows: 9,
    demonid: 10
  },

  bungieMembershipType: {
    all: -1,
    none: 0,
    tiger_xbox: 1,
    tiget_psn: 2,
    tiger_demon: 10,
    bungie_next: 254
  },

  capabilities: {
    none: 0,
    leaderboards: 1,
    callsign: 2
  },

  chatSecuritySetting: {
    group: 0,
    admins: 1
  },

  clientDeviceType: {
    unknown: 0,
    xbox360: 1,
    playstation3: 2,
    android_phone: 3,
    android_tablet: 4,
    apple_phone: 5,
    apple_tablet: 6,
    web_browser: 7,
    native_windows: 8,
    native_mac: 9,
    windows_phone: 10,
    windows_tablet: 11,
    xbox_one: 12,
    playstation4: 13,
    fake: 255
  },

  communityContentSortMode: {
    trending: 0,
    latest: 1,
    highest_rated: 2
  },

  communityStatusSort: {
    viewers: 0,
    trending: 1,
    overallViewers: 2,
    followers: 3
  },

  contentDateRange: {
    all: 0,
    today: 1,
    yesterday: 2,
    this_month: 3,
    this_year: 4,
    last_year: 5,
    earlier_than_last_year: 6
  },

  contentDateType: {
    specific: 0,
    month_only: 1,
    custom: 2
  },

  contentPropertyDataType: {
    none: 0,
    plaintext: 1,
    html: 2,
    dropdown: 3,
    list: 4,
    json: 5,
    content: 6,
    representation: 7,
    set: 8,
    file: 9,
    folder_set: 10,
    date: 11,
    multiline_plaintext: 12,
    destiny_content: 13
  },

  contentSortBy: {
    creation_date: 0,
    cms_path: 1,
    modified_date: 2
  },

  credentialType: {
    none: 0,
    xuid: 1,
    psnid: 2,
    wlid: 3,
    fake: 4,
    facebook: 5,
    xbox_gamertag: 6,
    playstation_online_id: 7,
    google: 8,
    windows: 9,
    demon_id: 10,
    demon_display_name: 11,
    bungie_membership_id: 255
  },

  damageType: {
    none: 0,
    kinetic: 1,
    arc: 2,
    thermal: 3,
    void: 4,
    raid: 5
  },

  destinyAccountTransferState: {
    unknown: 0,
    no_transfer: 1,
    back_transfer: 2,
    v1_active: 3,
    accounts_split: 4
  },

  destinyActivityDifficultyTier: {
    trivial: 0,
    easy: 1,
    normal: 2,
    challenging: 3,
    hard: 4,
    brave: 5,
    almost_impossible: 6,
    impossible: 7
  },

  destinyActivityModeType: {
    none: 0,
    story: 2,
    strike: 3,
    raid: 4,
    all_pvp: 5,
    patrol: 6,
    all_pve: 7,
    pvp_introduction: 8,
    three_vs_three: 9,
    control: 10,
    lockdown: 11,
    team: 12,
    free_for_all: 13,
    trials_of_osiris: 14,
    doubles: 15,
    nightfall: 16,
    heroic: 17,
    all_strikes: 18,
    iron_banner: 19,
    all_arena: 20,
    arena: 21,
    arena_challenge: 22,
    elimination: 23,
    rift: 24,
    all_mayhem: 25,
    mayhem_clash: 26,
    mayhem_rumble: 27,
    zone_control: 28,
    racing: 29,
    arena_elder_challenge: 30,
    supremacy: 31,
    private_matches_all: 32,
    supremacy_rumble: 33,
    supremacy_clash: 34,
    supremacy_inferno: 35,
    supremacy_mayhem: 36
  },

  destinyCardRarity: {
    none: 0,
    common: 1,
    superior: 2,
    exotic: 3
  },

  destinyClass: {
    titan: 0,
    hunter: 1,
    warlock: 2,
    unknown: 3
  },

  destinyDefinitionType: {
    none: 0,
    activity: 1,
    activity_type: 2,
    class: 3,
    gender: 4,
    inventory_bucket: 5,
    inventory_item: 6,
    progression: 7,
    race: 8,
    stat: 9,
    talent_grid: 10,
    stat_group: 11,
    unlock_flag: 12,
    vendor: 13,
    destination: 14,
    place: 15,
    directory_book: 16,
    material_requirement: 17,
    sandbox_perk: 18,
    art_dye: 19,
    art_dye_channel: 20,
    activity_bundle: 21,
    gear_asset: 22,
    grimoire_card: 23
  },

  destinyExcellenceBadgeTier: {
    none: 0,
    bronze: 1,
    silver: 2,
    gold: 3
  },

  destinyExplorerBuckets: {
    none: 0,
    artifact: 1,
    materials: 2,
    consumables: 4,
    mission: 8,
    bounties: 16,
    build: 32,
    primary_weapon: 64,
    special_weapon: 128,
    heavy_weapon: 256,
    head: 512,
    arms: 1024,
    chest: 2048,
    legs: 4096,
    class_items: 8192,
    ghost: 16384,
    vehicle: 32758,
    ship: 65536,
    shader: 131072,
    emblem: 262144
  },

  destinyExplorerOrderBy: {
    none: 0,
    name: 1,
    item_type: 2,
    rarity: 3,
    item_type_name: 4,
    item_stat_hash: 5,
    minimum_required_level: 6,
    maximum_required_level: 7
  },

  destinyExplorerOrderDirection: {
    none: 0,
    ascending: 1,
    descending: 2
  },

  destinyGameVersions: {
    none: 0,
    destiny1: 1,
    the_dark_below: 2,
    house_of_wolves: 4,
    comet: 8,
    rise_of_iron: 16
  },

  destinyGender: {
    male: 0,
    female: 1,
    unknown: 2
  },

  destinyItemSubType: {
    none: 0,
    crucible: 1,
    vanguard: 2,
    iron_banner: 3,
    queen: 4,
    exotic: 5,
    auto_rifle: 6,
    shotgun: 7,
    machinegun: 8,
    hand_cannon: 9,
    rocket_launcher: 10,
    fusion_rifle: 11,
    sniper_rifle: 12,
    pulse_rifle: 13,
    scout_rifle: 14,
    camera: 15,
    crm: 16,
    sidearm: 17,
    sword: 18,
    mask: 19
  },

  destinyItemType: {
    none: 0,
    currency: 1,
    armor: 2,
    weapon: 3,
    bounty: 4,
    completed_bounty: 5,
    bounty_reward: 6,
    message: 7,
    engram: 8,
    consumable: 9,
    exchange_material: 10,
    mission_reward: 11,
    quest_step: 12,
    quest_step_complete: 13,
    emblem: 14,
    quest: 15
  },

  destinyRace: {
    human: 0,
    awoken: 1,
    exo: 2,
    unknown: 3
  },

  destinyRecordBookPageDisplayStyle: {
    record_page: 0,
    summary_page: 1
  },

  destinyRecordCompletionStatus: {
    incomplete: 0,
    complete: 1,
    redeemed: 2
  },

  destinyRecordUiStyle: {
    integer: 0,
    percentage: 1,
    time_in_seconds: 2,
    boolean: 3,
    number_with_two_decimal_places: 4
  },

  destinyRewardSourceCategory: {
    none: 0,
    activity: 1,
    vendor: 2,
    aggregate: 3
  },

  destinyStatAggregationType: {
    character_average: 0,
    character: 1,
    item: 2
  },

  destinyStatsCategoryType: {
    none: 0,
    kills: 1,
    assists: 2,
    deaths: 3,
    criticals: 4,
    kda: 5,
    kd: 6,
    score: 7,
    entered: 8,
    time_played: 9,
    medal_wins: 10,
    medal_game: 11,
    medal_special_kills: 12,
    medal_sprees: 13,
    medal_multi_kills: 14,
    medal_abilities: 15
  },

  destinyStatsGroupType: {
    none: 0,
    general: 1,
    weapons: 2,
    medals: 3,
    enemies: 4,
    reserved_groups: 100,
    leaderboard: 101,
    activity: 102,
    unique_weapon: 103,
    internal: 104
  },

  destinyStatsMergeMethod: {
    add: 0,
    min: 1,
    max: 2
  },

  destinyTalentNodeState: {
    invalid: 0,
    can_upgrade: 1,
    no_points: 2,
    no_prerequisites: 3,
    no_steps: 4,
    no_unlock: 5,
    no_material: 6,
    no_grid_level: 7,
    swapping_locked: 8,
    must_swap: 9,
    complete: 10,
    unknown: 11,
    creation_only: 12,
    hidden: 13
  },

  destinyTalentNodeStepDamageTypes: {
    none: 0,
    kinetic: 1,
    arc: 2,
    solar: 4,
    void: 8,
    all: 15
  },

  destinyTalentNodeStepGuardianAttributes: {
    none: 0,
    stats: 1,
    shields: 2,
    health: 4,
    revive: 8,
    aim_under_fire: 16,
    radar: 32,
    invisibility: 64,
    reputations: 128,
    all: 255
  },

  destinyTalentNodeStepImpactEffects: {
    none: 0,
    armor_piercing: 1,
    ricochet: 2,
    flinch: 4,
    collateral_damage: 8,
    disorient: 16,
    highlight_target: 32,
    all: 63
  },

  destinyTalentNodeStepLightAbilities: {
    none: 0,
    grenades: 1,
    melee: 2,
    movement_modes: 4,
    orbs: 8,
    super_energy: 16,
    super_mods: 32,
    all: 63
  },

  destinyTalentNodeStepWeaponPerformances: {
    none: 0,
    rate_of_fire: 1,
    damage: 2,
    accuracy: 4,
    range: 8,
    zoom: 16,
    recoil: 32,
    ready: 64,
    reload: 128,
    hair_trigger: 256,
    ammo_and_magazine: 512,
    tracking_and_detonation: 1024,
    shotgun_spread: 2048,
    charge_tme: 4096,
    all: 8191
  },

  destinyUnlockFlagOperator: {
    invalid: 0,
    flag: 1,
    not: 2,
    or: 3,
    and: 4,
    nor: 5,
    xor: 6,
    nand: 7,
    equal: 8,
    not_equal: 9,
    unlock_value: 10,
    constant: 11,
    greater_than: 12,
    greater_than_or_equal: 13,
    less_than: 14,
    less_than_or_equal: 15,
    add: 16,
    subtract: 17,
    multiply: 18,
    divide: 19,
    modulus: 20,
    negate: 21
  },

  destinyUnlockValueUIStyle: {
    automatic: 0,
    fraction: 1,
    checkbox: 2,
    percentage: 3
  },

  destinyVendorItemRefundPolicy: {
    not_refundable: 0,
    deletes_item: 1,
    revokes_license: 2
  },

  directorNodeState: {
    hidden: 0,
    visible: 1,
    teaser: 2,
    incomplete: 3,
    completed: 4
  },

  directorNodeUIModifier: {
    none: 0,
    enlarge: 1,
    tower: 2,
    unexpected: 3
  },

  directorTransitionType: {
    transition_book: 0,
    transition_social: 1
  },

  entityType: {
    none: 0,
    user: 1,
    group: 2,
    post: 3,
    invitation: 4,
    report: 5,
    activity: 6,
    conversation: 7,
    tag: 8,
    application: 9
  },

  equipFailureReason: {
    none: 0,
    item_unequippable: 1,
    item_unique_equip_restricted: 2,
    item_failed_unlock_check: 4,
    item_failed_level_check: 8,
    item_not_on_character: 16
  },

  eventConversationType: {
    none: 0,
    private: 1,
    group: 2
  },

  externalService: {
    none: 0,
    twitter: 1,
    facebook: 2,
    youtube: 3,
    twitter_help: 4
  },

  forumFlags: {
    none: 0,
    bungie_staff_post: 1,
    forum_ninja_post: 2,
    forum_mentor_post: 4,
    topic_bungie_staff_posted: 8,
    topic_bungie_volunteer_posted: 16,
    question_answered_by_bungie: 32,
    question_answered_by_ninja: 64,
    community_content: 128
  },

  forumFlagsEnum: {
    none: 0,
    bungie_staff_post: 1,
    forum_ninja_post: 2,
    forum_mentor_post: 4,
    topic_bungie_staff_posted: 8,
    topic_bungie_volunteer_posted: 16,
    question_answered_by_bungie: 32,
    question_answered_by_ninja: 64
  },

  forumMediaType: {
    none: 0,
    image: 1,
    video: 2,
    youtube: 3
  },

  forumPostCategory: {
    none: 0,
    text_only: 1,
    media: 2,
    link: 4,
    poll: 8,
    question: 16,
    answered: 32,
    announcement: 64,
    content_comment: 128,
    bungie_official: 256
  },

  forumPostCategoryEnums: {
    none: 0,
    text_only: 1,
    media: 2,
    link: 4,
    poll: 5,
    question: 16,
    answered: 32,
    announcement: 64,
    content_comment: 128,
    bungie_official: 256,
    ninja_official: 512
  },

  forumPostPopularity: {
    empty: 0,
    default: 1,
    discussed: 2,
    cool_story: 3,
    heating_up: 4,
    hot: 5
  },

  forumPostSortEnum: {
    default: 0,
    oldest_first: 1
  },

  forumRecruitmentIntensityLabel: {
    none: 0,
    casual: 1,
    professional: 2
  },

  forumRecruitmentToneLabel: {
    none: 0,
    family_friendly: 1,
    rowdy: 2
  },

  forumTopicsCategoryFilters: {
    none: 0,
    links: 1,
    questions: 2,
    answered_questions: 4,
    media: 8,
    text_only: 16,
    announcement: 32,
    bungie_official: 64,
    polls: 128
  },

  forumTopicsCategoryFiltersEnum: {
    none: 0,
    links: 1,
    questions: 2,
    answered_questions: 4,
    media: 8,
    text_only: 16,
    announcement: 32,
    bungie_official: 64,
    polls: 128
  },

  forumTopicsQuickDate: {
    all: 0,
    last_year: 1,
    last_month: 2,
    last_week: 3,
    last_day: 4
  },

  forumTopicsQuickDateEnum: {
    all: 0,
    last_year: 1,
    last_month: 2,
    last_week: 3,
    last_day: 4
  },

  forumTopicsSort: {
    default: 0,
    last_replied: 1,
    most_replied: 2,
    popularity: 3,
    controversiality: 4,
    liked: 5,
    highest_rated: 6,
    most_upvoted: 7
  },

  forumTopicsSortEnum: {
    default: 0,
    last_replied: 1,
    most_replied: 2,
    popularity: 3,
    controversiality: 4,
    liked: 5,
    highest_rated: 6
  },

  forumTypeEnum: {
    public: 0,
    news: 1,
    group: 2,
    alliance: 3,
    related_posts: 4
  },

  friendOnlineStatus: {
    offline: 0,
    online: 1,
    idle: 2
  },

  gameServiceStatus: {
    error: 0,
    not_found: 1,
    success: 2,
    unknown: 3
  },

  globalAcknowledgementItem: {
    triumphs: 0,
    gear_manager: 1
  },

  globalAlertLevel: {
    unknown: 0,
    blue: 1,
    yellow: 2,
    red: 3
  },

  groupAllianceStatus: {
    unallied: 0,
    parent: 1,
    child: 2
  },

  groupApplicationResolveState: {
    unresolved: 0,
    accepted: 1,
    denied: 2,
    rescinded: 3
  },

  groupAttributeType: {
    computed: 0,
    point: 1,
    range: 2
  },

  groupClanEnableStatus: {
    not_applicable: 0,
    clan_enabled_success: 1,
    clan_enabled_failure: 2
  },

  groupDateRange: {
    all: 0,
    past_day: 1,
    past_week: 2,
    past_month: 3,
    past_year: 4
  },

  groupHomepage: {
    wall: 0,
    forum: 1,
    alliance_forum: 2
  },

  groupMemberCountFilter: {
    all: 0,
    one_to_ten: 1,
    eleven_to_one_hundred: 2,
    greater_than_one_hundred: 3
  },

  groupMemberSortBy: {
    type_and_duration: 0,
    duration: 1,
    name: 2,
    activity: 3
  },

  groupMemberType: {
    none: -1,
    member: 0,
    admin: 1,
    founder: 2
  },

  groupPostPublicity: {
    public: 0,
    alliance: 1,
    private: 2
  },

  groupRelationshipResult: {
    approved: 0,
    created: 1,
    failed: 2
  },

  groupSortBy: {
    name: 0,
    date: 1,
    popularity: 2,
    id: 3
  },

  groupType: {
    general: 0
  },

  groupsForMemberFilter: {
    all: 0,
    founded: 1,
    non_founded: 2
  },

  groupTypeSearchFilter: {
    all: 0,
    group: 1,
    clan: 2
  },

  ignoreLength: {
    none: 0,
    week: 1,
    two_weeks: 2,
    three_weeks: 3,
    month: 4,
    three_months: 5,
    six_months: 6,
    year: 7,
    forever: 8,
    three_minutes: 9,
    hour: 10,
    thirty_days: 11
  },

  ignoreStatus: {
    not_ignored: 0,
    ignored_user: 1,
    ignored_group: 2,
    ignored_by_group: 4,
    ignored_post: 8,
    ignored_tag: 16,
    ignored_global: 32
  },

  ignoredItemType: {
    all: 0,
    post: 1,
    group: 2,
    user: 3,
    tag: 4,
    group_profile: 5,
    user_profile: 6,
    user_private_message: 7,
    group_wall_post: 8,
    private_message: 9
  },

  invitationResponseState: {
    unreviewed: 0,
    approved: 1,
    rejected: 2
  },

  invitationType: {
    none: 0,
    group_alliance_join_from_child: 1,
    clan_join_invite: 2,
    group_alliance_invite_from_owner: 3,
    group_join_invite: 4,
    clan_join_request: 5,
    group_join_request: 6
  },

  itemBindStatus: {
    not_bound: 0,
    bound_to_character: 1,
    bound_to_account: 2,
    bound_to_guild: 3
  },

  itemLocation: {
    unknown: 0,
    inventory: 1,
    vault: 2,
    vendor: 3,
    postmaster: 4
  },

  itemState: {
    none: 0,
    locked: 1,
    tracked: 2
  },

  marketplaceCodeRegion: {
    global: 0,
    usa: 1,
    europe: 2,
    japan: 3
  },

  membershipOption: {
    reviewed: 0,
    open: 1,
    closed: 2
  },

  migrationMode: {
    convert_to_clan: 0,
    split_clan: 1
  },

  moderatorRequestedPunishment: {
    unknown: 0,
    warning: 1,
    seven_day_ban: 2,
    thirty_day_ban: 3,
    permanent_ban: 4
  },

  notificationMethod: {
    none: 0,
    email: 1,
    mobile_push: 2,
    web_only: 4
  },

  notificationType: {
    message: 1,
    forum_reply: 2,
    new_activity_rollup: 3,
    settings_change: 4,
    group_acceptance: 5,
    group_join_request: 6,
    follow_user_activity: 7,
    friend_user_activity: 8,
    forum_like: 9,
    followed: 10,
    group_banned: 11,
    banned: 12,
    unbanned: 13,
    group_open_join: 14,
    group_alliance_join_requested: 15,
    group_alliance_join_rejected: 16,
    group_alliance_join_approved: 17,
    group_alliance_broken: 18,
    group_denial: 19,
    warned: 20,
    clan_disabled: 21,
    group_alliance_invite_requested: 22,
    group_alliance_invite_rejected: 23,
    group_alliance_invite_approved: 24,
    group_followed_by_group: 25,
    grimoire_unobserved_cards: 26,
    community_content_like: 27,
    community_content_approved: 28,
    user_profile_banned: 29,
    user_message_banned: 30,
    support_form_received: 31,
    raf_newbie_needs_to_play_ttk: 32,
    raf_ttk_quest_ready: 33,
    recruit_thread_ready: 34,
    recruit_thread_kicked: 35,
    recruit_thread_canceled: 36,
    group_wall_banned: 37,
    banned_permanent: 38,
    user_profile_banned_permanent: 39,
    user_message_banned_permanent: 40,
    group_wall_banned_permanent: 41,
    application_authorized: 42
  },

  offerRedeemMode: {
    off: 0,
    unlock: 1,
    platform: 2,
    expired: 3,
    consumable: 4
  },

  optInFlags: {
    newsletter: 1,
    system: 2,
    marketing: 4,
    user_research: 8,
    customer_service: 16
  },

  partershipType: {
    none: 0,
    twitch: 1
  },

  platformErrorCodes: {
    none: 0,
    success: 1,
    transport_exception: 2,
    unhandled_exception: 3,
    not_implemented: 4,
    system_disabled: 5,
    failed_to_load_available_locales_configuration: 6,
    parameter_parse_failure: 7,
    parameter_invalid_range: 8,
    bad_request: 9,
    authentication_invalid: 10,
    data_not_found: 11,
    insufficient_privileges: 12,
    duplicate: 13,
    unknown_sql_result: 14,
    validation_error: 15,
    validation_missing_field_error: 16,
    validation_invalid_input_error: 17,
    invalid_parameters: 18,
    parameter_not_found: 19,
    unhandled_http_exception: 20,
    not_found: 21,
    web_auth_module_async_failed: 22,
    invalid_return_value: 23,
    user_banned: 24,
    invalid_post_body: 25,
    missing_post_body: 26,
    external_service_timeout: 27,
    validation_length_error: 28,
    validation_range_error: 29,
    json_deserialization_error: 30,
    throttle_limit_exceeded: 31,
    validation_tag_error: 32,
    validation_profanity_error: 33,
    validation_url_format_error: 34,
    throttle_limit_exceeded_minutes: 35,
    throttle_limit_exceeded_momentarily: 36,
    throttle_limit_exceeded_seconds: 37,
    external_service_unknown: 38,
    validation_word_length_error: 39,
    validation_invisible_unicode: 40,
    validation_bad_names: 41,
    external_service_failed: 42,
    service_retired: 43,
    unknown_sql_exception: 44,
    unsupported_locale: 45,
    invalid_page_number: 46,
    maximum_page_size_exceeded: 47,
    service_unsupported: 48,
    validation_maximum_unicode_combining_characters: 49,
    validation_maximum_sequential_carriage_returns: 50,
    per_endpoint_request_throttle_exceeded: 51,
    auth_context_cache_assertion: 52,
    obsolete_credential_type: 89,
    unable_to_un_pair_mobile_app: 90,
    unable_to_pair_mobile_app: 91,
    cannot_use_mobile_auth_with_non_mobile_provider: 92,
    missing_device_cookie: 93,
    facebook_token_expired: 94,
    auth_ticket_required: 95,
    cookie_context_required: 96,
    unknown_authentication_error: 97,
    bungie_net_account_creation_required: 98,
    web_auth_required: 99,
    content_unknown_sql_result: 100,
    content_need_unique_path: 101,
    content_sql_exception: 102,
    content_not_found: 103,
    content_success_with_tag_add_fail: 104,
    content_search_missing_parameters: 105,
    content_invalid_id: 106,
    content_physical_file_deletion_error: 107,
    content_physical_file_creation_error: 108,
    content_perforce_submission_error: 109,
    content_perforce_initialization_error: 110,
    content_deployment_package_not_ready_error: 111,
    content_upload_failed: 112,
    content_too_many_results: 113,
    content_invalid_state: 115,
    content_navigation_parent_not_found: 116,
    content_navigation_parent_update_error: 117,
    deployment_package_not_editable: 118,
    content_validation_error: 119,
    content_properties_validation_error: 120,
    content_type_not_found: 121,
    deployment_package_not_found: 122,
    content_search_invalid_parameters: 123,
    content_item_property_aggregation_error: 124,
    deployment_package_file_not_found: 125,
    content_perforce_file_history_not_found: 126,
    content_asset_zip_creation_failure: 127,
    content_asset_zip_creation_busy: 128,
    content_project_not_found: 129,
    content_folder_not_found: 130,
    content_packages_inconsistent: 131,
    content_packages_invalid_state: 132,
    content_packages_inconsistent_type: 133,
    content_cannot_delete_package: 134,
    content_locked_for_changes: 135,
    content_file_upload_failed: 136,
    content_not_reviewed: 137,
    content_permission_denied: 138,
    content_invalid_external_url: 139,
    content_external_file_cannot_be_imported_locally: 140,
    content_tag_save_failure: 141,
    content_perforce_unmatched_file_error: 142,
    content_perforce_changelist_result_not_found: 143,
    content_perforce_changelist_file_items_not_found: 144,
    content_perforce_invalid_revision_error: 145,
    content_unloaded_save_result: 146,
    content_property_invalid_number: 147,
    content_property_invalid_url: 148,
    content_property_invalid_date: 149,
    content_property_invalid_set: 150,
    content_property_cannot_deserialize: 151,
    content_regex_validation_fail_on_property: 152,
    content_max_length_fail_on_property: 153,
    content_property_unexpected_deserialization_error: 154,
    content_property_required: 155,
    content_cannot_create_file: 156,
    content_invalid_migration_file: 157,
    content_migration_altering_processed_item: 158,
    content_property_definition_not_found: 159,
    content_review_data_changed: 160,
    content_rollback_revision_not_in_package: 161,
    content_item_not_based_on_latest_revision: 162,
    content_unauthorized: 163,
    content_cannot_create_deployment_package: 164,
    content_user_not_found: 165,
    content_locale_permission_denied: 166,
    content_invalid_link_to_internal_environment: 167,
    content_invalid_blacklisted_content: 168,
    content_macro_malformed_no_content_id: 169,
    content_macro_malformed_no_template_type: 170,
    content_illegal_bnet_membership_id: 171,
    content_locale_did_not_match_expected: 172,
    content_babel_call_failed: 173,
    user_non_unique_name: 200,
    user_manual_linking_step_required: 201,
    user_create_unknown_sql_result: 202,
    user_create_unknown_sql_exception: 203,
    user_malformed_membership_id: 204,
    user_cannot_find_requested_user: 205,
    user_cannot_load_account_credential_link_info: 206,
    user_invalid_mobile_app_type: 207,
    user_missing_mobile_pairing_info: 208,
    user_cannot_generate_mobile_key_while_using_mobile_credential: 209,
    user_generate_mobile_key_existing_slot_collision: 210,
    user_display_name_missing_or_invalid: 211,
    user_cannot_load_account_profile_data: 212,
    user_cannot_save_user_profile_data: 213,
    user_email_missing_or_invalid: 214,
    user_terms_of_use_required: 215,
    user_cannot_create_new_account_while_logged_in: 216,
    user_cannot_resolve_central_account: 217,
    user_invalid_avatar: 218,
    user_missing_created_user_result: 219,
    user_cannot_change_unique_name_yet: 220,
    user_cannot_change_display_name_yet: 221,
    user_cannot_change_email: 222,
    user_unique_name_must_start_with_letter: 223,
    user_no_linked_accounts_support_friend_listings: 224,
    user_acknowledgment_table_full: 225,
    user_creation_destiny_membership_required: 226,
    user_friends_token_needs_refresh: 227,
    messaging_unknown_error: 300,
    messaging_self_error: 301,
    messaging_send_throttle: 302,
    messaging_no_body: 303,
    messaging_too_many_users: 304,
    messaging_can_not_leave_conversation: 305,
    messaging_unable_to_send: 306,
    messaging_deleted_user_forbidden: 307,
    messaging_cannot_delete_external_conversation: 308,
    messaging_group_chat_disabled: 309,
    messaging_must_include_self_in_private_message: 310,
    messaging_sender_is_banned: 311,
    add_survey_answers_unknown_sql_exception: 400,
    forum_body_cannot_be_empty: 500,
    forum_subject_cannot_be_empty_on_topic_post: 501,
    forum_cannot_locate_parent_post: 502,
    forum_thread_locked_for_replies: 503,
    forum_unknown_sql_result_during_create_post: 504,
    forum_unknown_tag_creation_error: 505,
    forum_unknown_sql_result_during_tag_item: 506,
    forum_unknown_exception_create_post: 507,
    forum_question_must_be_topic_post: 508,
    forum_exception_during_tag_search: 509,
    forum_exception_during_topic_retrieval: 510,
    forum_aliased_tag_error: 511,
    forum_cannot_locate_thread: 512,
    forum_unknown_exception_edit_post: 513,
    forum_cannot_locate_post: 514,
    forum_unknown_exception_get_or_create_tags: 515,
    forum_edit_permission_denied: 516,
    forum_unknown_sql_result_during_tag_id_retrieval: 517,
    forum_cannot_get_rating: 518,
    forum_unknown_exception_get_rating: 519,
    forum_ratings_access_error: 520,
    forum_related_post_access_error: 521,
    forum_latest_reply_access_error: 522,
    forum_user_status_access_error: 523,
    forum_author_access_error: 524,
    forum_group_access_error: 525,
    forum_url_expected_but_missing: 526,
    forum_replies_cannot_be_empty: 527,
    forum_replies_cannot_be_in_different_groups: 528,
    forum_sub_topic_cannot_be_created_at_this_thread_level: 529,
    forum_cannot_create_content_topic: 530,
    forum_topic_does_not_exist: 531,
    forum_content_comments_not_allowed: 532,
    forum_unknown_sql_result_during_edit_post: 533,
    forum_unknown_sql_result_during_get_post: 534,
    forum_post_validation_bad_url: 535,
    forum_body_too_long: 536,
    forum_subject_too_long: 537,
    forum_announcement_not_allowed: 538,
    forum_cannot_share_own_post: 539,
    forum_edit_no_op: 540,
    forum_unknown_database_error_during_get_post: 541,
    forum_exceeed_maximum_row_limit: 542,
    forum_cannot_share_private_post: 543,
    forum_cannot_cross_post_between_groups: 544,
    forum_incompatible_categories: 555,
    forum_cannot_use_these_categories_on_non_topic_post: 556,
    forum_can_only_delete_topics: 557,
    forum_delete_sql_exception: 558,
    forum_delete_sql_unknown_result: 559,
    forum_too_many_tags: 560,
    forum_can_only_rate_topics: 561,
    forum_banned_posts_cannot_be_edited: 562,
    forum_thread_root_is_banned: 563,
    forum_cannot_use_official_tag_category_as_tag: 564,
    forum_answer_cannot_be_made_on_create_post: 565,
    forum_answer_cannot_be_made_on_edit_post: 566,
    forum_answer_post_id_is_not_adirect_reply_of_question: 567,
    forum_answer_topic_id_is_not_aquestion: 568,
    forum_unknown_exception_during_mark_answer: 569,
    forum_unknown_sql_result_during_mark_answer: 570,
    forum_cannot_rate_your_own_posts: 571,
    forum_polls_must_be_the_first_post_in_topic: 572,
    forum_invalid_poll_input: 573,
    forum_group_admin_edit_non_member: 574,
    forum_cannot_edit_moderator_edited_post: 575,
    forum_requires_destiny_membership: 576,
    forum_unexpected_error: 577,
    forum_age_lock: 578,
    forum_max_pages: 579,
    forum_max_pages_oldest_first: 580,
    forum_cannot_apply_forum_id_without_tags: 581,
    forum_cannot_apply_forum_id_to_non_topics: 582,
    forum_cannot_downvote_community_creations: 583,
    forum_topics_must_have_official_category: 584,
    forum_recruitment_topic_malformed: 585,
    forum_recruitment_topic_not_found: 586,
    forum_recruitment_topic_no_slots_remaining: 587,
    forum_recruitment_topic_kick_ban: 588,
    forum_recruitment_topic_requirements_not_met: 589,
    forum_recruitment_topic_no_players: 590,
    forum_recruitment_approve_fail_message_ban: 591,
    forum_recruitment_global_ban: 592,
    forum_user_banned_from_this_topic: 593,
    forum_recruitment_fireteam_members_only: 594,
    group_membership_application_already_resolved: 601,
    group_membership_already_applied: 602,
    group_membership_insufficient_privileges: 603,
    group_id_not_returned_from_creation: 604,
    group_search_invalid_parameters: 605,
    group_membership_pending_application_not_found: 606,
    group_invalid_id: 607,
    group_invalid_membership_id: 608,
    group_invalid_membership_type: 609,
    group_missing_tags: 610,
    group_membership_not_found: 611,
    group_invalid_rating: 612,
    group_user_following_access_error: 613,
    group_user_membership_access_error: 614,
    group_creator_access_error: 615,
    group_admin_access_error: 616,
    group_private_post_not_viewable: 617,
    group_membership_not_logged_in: 618,
    group_not_deleted: 619,
    group_unknown_error_undeleting_group: 620,
    group_deleted: 621,
    group_not_found: 622,
    group_member_banned: 623,
    group_membership_closed: 624,
    group_private_post_override_error: 625,
    group_name_taken: 626,
    group_deletion_grace_period_expired: 627,
    group_cannot_check_ban_status: 628,
    group_maximum_membership_count_reached: 629,
    no_destiny_account_for_clan_platform: 630,
    already_requesting_membership_for_clan_platform: 631,
    already_clan_member_on_platform: 632,
    group_joined_cannot_set_clan_name: 633,
    group_left_cannot_clear_clan_name: 634,
    group_relationship_request_pending: 635,
    group_relationship_request_blocked: 636,
    group_relationship_request_not_found: 637,
    group_relationship_block_not_found: 638,
    group_relationship_not_found: 639,
    group_already_allied: 641,
    group_already_member: 642,
    group_relationship_already_exists: 643,
    invalid_group_types_for_relationship_request: 644,
    group_at_maximum_alliances: 646,
    group_cannot_set_clan_only_settings: 647,
    clan_cannot_set_two_default_post_types: 648,
    group_member_invalid_member_type: 649,
    group_invalid_platform_type: 650,
    group_member_invalid_sort: 651,
    group_invalid_resolve_state: 652,
    clan_already_enabled_for_platform: 653,
    clan_not_enabled_for_platform: 654,
    clan_enabled_but_could_not_join_no_account: 655,
    clan_enabled_but_could_not_join_already_member: 656,
    clan_cannot_join_no_credential: 657,
    no_clan_membership_for_platform: 658,
    group_to_group_follow_limit_reached: 659,
    child_group_already_in_alliance: 660,
    owner_group_already_in_alliance: 661,
    alliance_owner_cannot_join_alliance: 662,
    group_not_in_alliance: 663,
    child_group_cannot_invite_to_alliance: 664,
    group_to_group_already_followed: 665,
    group_to_group_not_following: 666,
    clan_maximum_membership_reached: 667,
    clan_name_not_valid: 668,
    clan_name_not_valid_error: 669,
    alliance_owner_not_defined: 670,
    alliance_child_not_defined: 671,
    clan_name_illegal_characters: 672,
    clan_tag_illegal_characters: 673,
    clan_requires_invitation: 674,
    clan_membership_closed: 675,
    clan_invite_already_member: 676,
    group_invite_already_member: 677,
    group_join_approval_required: 678,
    clan_tag_required: 679,
    group_name_cannot_start_or_end_with_white_space: 680,
    clan_callsign_cannot_start_or_end_with_white_space: 681,
    clan_migration_failed: 682,
    clan_not_enabled_already_member_of_another_clan: 683,
    group_moderation_not_permitted_on_non_members: 684,
    clan_creation_in_world_server_failed: 685,
    clan_not_found: 686,
    clan_membership_level_does_not_permit_that_action: 687,
    clan_member_not_found: 688,
    clan_missing_membership_approvers: 689,
    clan_in_wrong_state_for_requested_action: 690,
    clan_name_already_used: 691,
    clan_too_few_members: 692,
    activities_unknown_exception: 701,
    activities_parameter_null: 702,
    activity_counts_diabled: 703,
    activity_search_invalid_parameters: 704,
    activity_permission_denied: 705,
    share_already_shared: 706,
    activity_logging_disabled: 707,
    item_already_followed: 801,
    item_not_followed: 802,
    cannot_follow_self: 803,
    group_follow_limit_exceeded: 804,
    tag_follow_limit_exceeded: 805,
    user_follow_limit_exceeded: 806,
    follow_unsupported_entity_type: 807,
    no_valid_tags_in_list: 900,
    below_minimum_suggestion_length: 901,
    cannot_get_suggestions_on_multiple_tags_simultaneously: 902,
    not_avalid_partial_tag: 903,
    tag_suggestions_unknown_sql_result: 904,
    tags_unable_to_load_popular_tags_from_database: 905,
    tag_invalid: 906,
    tag_not_found: 907,
    single_tag_expected: 908,
    ignore_invalid_parameters: 1,
    ignore_sql_exception: 1001,
    ignore_error_retrieving_group_permissions: 1002,
    ignore_error_insufficient_permission: 1003,
    ignore_error_retrieving_item: 1004,
    ignore_cannot_ignore_self: 1005,
    ignore_illegal_type: 1006,
    ignore_not_found: 1007,
    ignore_user_globally_ignored: 1008,
    ignore_user_ignored: 1009,
    notification_setting_invalid: 1100,
    psn_api_expired_access_token: 1204,
    psnex_forbidden: 1205,
    psnex_system_disabled: 1218,
    psn_api_error_code_unknown: 1223,
    psn_api_error_web_exception: 1224,
    psn_api_bad_request: 1225,
    psn_api_access_token_required: 1226,
    psn_api_invalid_access_token: 1227,
    psn_api_banned_user: 1229,
    psn_api_account_upgrade_required: 1230,
    psn_api_service_temporarily_unavailable: 1231,
    psn_api_server_busy: 1232,
    psn_api_under_maintenance: 1233,
    psn_api_profile_user_not_found: 1234,
    psn_api_profile_privacy_restriction: 1235,
    psn_api_profile_under_maintenance: 1236,
    psn_api_account_attribute_missing: 1237,
    xbl_ex_system_disabled: 1300,
    xbl_ex_unknown_error: 1301,
    xbl_api_error_web_exception: 1302,
    xbl_sts_token_invalid: 1303,
    xbl_sts_missing_token: 1304,
    xbl_sts_expired_token: 1305,
    xbl_access_to_the_sandbox_denied: 1306,
    xbl_msa_response_missing: 1307,
    xbl_msa_access_token_expired: 1308,
    xbl_msa_invalid_request: 1309,
    xbl_msa_friends_require_sign_in: 1310,
    xbl_user_action_required: 1311,
    xbl_parental_controls: 1312,
    xbl_developer_account: 1313,
    xbl_user_token_expired: 1314,
    xbl_user_token_invalid: 1315,
    xbl_offline: 1316,
    xbl_unknown_error_code: 1317,
    xbl_msa_invalid_grant: 1318,
    report_not_yet_resolved: 1400,
    report_overturn_does_not_change_decision: 1401,
    report_not_found: 1402,
    report_already_reported: 1403,
    report_invalid_resolution: 1404,
    legacy_game_stats_system_disabled: 1500,
    legacy_game_stats_unknown_error: 1501,
    legacy_game_stats_malformed_sneaker_net_code: 1502,
    destiny_account_acquisition_failure: 1600,
    destiny_account_not_found: 1601,
    destiny_build_stats_database_error: 1602,
    destiny_character_stats_database_error: 1603,
    destiny_pv_pstats_database_error: 1604,
    destiny_pv_estats_database_error: 1605,
    destiny_grimoire_stats_database_error: 1606,
    destiny_stats_parameter_membership_type_parse_error: 1607,
    destiny_stats_parameter_membership_id_parse_error: 1608,
    destiny_stats_parameter_range_parse_error: 1609,
    destiny_string_item_hash_not_found: 1610,
    destiny_string_set_not_found: 1611,
    destiny_content_lookup_not_found_for_key: 1612,
    destiny_content_item_not_found: 1613,
    destiny_content_section_not_found: 1614,
    destiny_content_property_not_found: 1615,
    destiny_content_config_not_found: 1616,
    destiny_content_property_bucket_value_not_found: 1617,
    destiny_unexpected_error: 1618,
    destiny_invalid_action: 1619,
    destiny_character_not_found: 1620,
    destiny_invalid_flag: 1621,
    destiny_invalid_request: 1622,
    destiny_item_not_found: 1623,
    destiny_invalid_customization_choices: 1624,
    destiny_vendor_item_not_found: 1625,
    destiny_internal_error: 1626,
    destiny_vendor_not_found: 1627,
    destiny_recent_activities_database_error: 1628,
    destiny_item_bucket_not_found: 1629,
    destiny_invalid_membership_type: 1630,
    destiny_version_incompatibility: 1631,
    destiny_item_already_in_inventory: 1632,
    destiny_bucket_not_found: 1633,
    destiny_character_not_in_tower: 1634,
    destiny_character_not_logged_in: 1635,
    destiny_definitions_not_loaded: 1636,
    destiny_inventory_full: 1637,
    destiny_item_failed_level_check: 1638,
    destiny_item_failed_unlock_check: 1639,
    destiny_item_unequippable: 1640,
    destiny_item_unique_equip_restricted: 1641,
    destiny_no_room_in_destination: 1642,
    destiny_service_failure: 1643,
    destiny_service_retired: 1644,
    destiny_transfer_failed: 1645,
    destiny_transfer_not_found_for_source_bucket: 1646,
    destiny_unexpected_result_in_vendor_transfer_check: 1647,
    destiny_uniqueness_violation: 1648,
    destiny_error_deserialization_failure: 1649,
    destiny_valid_account_ticket_required: 1650,
    destiny_shard_relay_client_timeout: 1651,
    destiny_shard_relay_proxy_timeout: 1652,
    destiny_pgcrnot_found: 1653,
    destiny_account_must_be_offline: 1654,
    destiny_can_only_equip_in_game: 1655,
    destiny_cannot_perform_action_on_equipped_item: 1656,
    destiny_quest_already_completed: 1657,
    destiny_quest_already_tracked: 1658,
    destiny_trackable_quests_full: 1659,
    destiny_item_not_transferrable: 1660,
    destiny_vendor_purchase_not_allowed: 1661,
    destiny_content_version_mismatch: 1662,
    destiny_item_action_forbidden: 1663,
    destiny_refund_invalid: 1664,
    destiny_privacy_restriction: 1665,
    destiny_action_insufficient_privileges: 1666,
    destiny_invalid_claim_exception: 1667,
    fb_invalid_request: 1800,
    fb_redirect_mismatch: 1801,
    fb_access_denied: 1802,
    fb_unsupported_response_type: 1803,
    fb_invalid_scope: 1804,
    fb_unsupported_grant_type: 1805,
    fb_invalid_grant: 1806,
    invitation_expired: 1900,
    invitation_unknown_type: 1901,
    invitation_invalid_response_status: 1902,
    invitation_invalid_type: 1903,
    invitation_already_pending: 1904,
    invitation_insufficient_permission: 1905,
    invitation_invalid_code: 1906,
    invitation_invalid_target_state: 1907,
    invitation_cannot_be_reactivated: 1908,
    invitation_no_recipients: 1910,
    invitation_group_cannot_send_to_self: 1911,
    invitation_too_many_recipients: 1912,
    invitation_invalid: 1913,
    invitation_not_found: 1914,
    token_invalid: 2,
    token_bad_format: 2001,
    token_already_claimed: 2002,
    token_already_claimed_self: 2003,
    token_throttling: 2004,
    token_unknown_redemption_failure: 2005,
    token_purchase_claim_failed_after_token_claimed: 2006,
    token_user_already_owns_offer: 2007,
    token_invalid_offer_key: 2008,
    token_email_not_validated: 2009,
    token_provisioning_bad_vendor_or_offer: 2010,
    token_purchase_history_unknown_error: 2011,
    token_throttle_state_unknown_error: 2012,
    token_user_age_not_verified: 2013,
    token_exceeded_offer_maximum: 2014,
    token_no_available_unlocks: 2015,
    token_marketplace_invalid_platform: 2016,
    token_no_marketplace_codes_found: 2017,
    token_offer_not_available_for_redemption: 2018,
    token_unlock_partial_failure: 2019,
    token_marketplace_invalid_region: 2020,
    token_offer_expired: 2021,
    rafexceeded_maximum_referrals: 2022,
    rafduplicate_bond: 2023,
    rafno_valid_veteran_destiny_memberships_found: 2024,
    rafnot_avalid_veteran_user: 2025,
    rafcode_already_claimed_or_not_found: 2026,
    rafmismatched_destiny_membership_type: 2027,
    rafunable_to_access_purchase_history: 2028,
    rafunable_to_create_bond: 2029,
    rafunable_to_find_bond: 2030,
    rafunable_to_remove_bond: 2031,
    rafcannot_bond_to_self: 2032,
    rafinvalid_platform: 2033,
    rafgenerate_throttled: 2034,
    rafunable_to_create_bond_version_mismatch: 2035,
    rafunable_to_remove_bond_version_mismatch: 2036,
    rafredeem_throttled: 2037,
    no_available_discount_code: 2038,
    discount_already_claimed: 2039,
    discount_claim_failure: 2040,
    discount_configuration_failure: 2041,
    discount_generation_failure: 2042,
    discount_already_exists: 2043,
    api_exceeded_max_keys: 2100,
    api_invalid_or_expired_key: 2101,
    api_key_missing_from_request: 2102,
    application_disabled: 2103,
    application_exceeded_max: 2104,
    application_disallowed_by_scope: 2105,
    authorization_code_invalid: 2106,
    origin_header_does_not_match_key: 2107,
    access_not_permitted_by_application_scope: 2108,
    application_name_is_taken: 2109,
    refresh_token_not_yet_valid: 2110,
    access_token_has_expired: 2111,
    partnership_invalid_type: 2200,
    partnership_validation_error: 2201,
    partnership_validation_timeout: 2202,
    partnership_access_failure: 2203,
    partnership_account_invalid: 2204,
    partnership_get_account_info_failure: 2205,
    partnership_disabled: 2206,
    partnership_already_exists: 2207,
    twitch_not_linked: 2208,
    twitch_account_not_found: 2209,
    twitch_could_not_load_destiny_info: 2210,
    community_streaming_unavailable: 2230
  },

  periodType: {
    none: 0,
    daily: 1,
    monthly: 2,
    all_time: 3,
    activity: 4
  },

  rafBondState: {
    none: 0,
    awaiting_new_player_destiny_membership: 1,
    awaiting_new_player_verification: 2,
    new_player_verified: 3,
    bond_locked_in: 100,
    bond_removed: -100,
    failed_new_player_already_referred: -3,
    failed_new_player_is_veteran_player: -2,
    failed_new_player_is_not_new: -1
  },

  rafEligibility: {
    unknown: 0,
    purchase_required: 1,
    new_player_eligible: 2,
    not_eligible: -1
  },

  realTimeEventType: {
    none: 0,
    conversation_changed: 1,
    typing: 2,
    notifications_changed: 3,
    message_counts: 4,
    friend_counts: 5,
    announcements: 6,
    recruit_thread_update: 7
  },

  reportResolutionStatus: {
    unresolved: 0,
    innocent: 1,
    guilty_ban: 2,
    guilty_blast_ban: 3,
    guilty_warn: 4,
    guilty_alias: 5,
    resolve_no_action: 6
  },

  requestedPunishment: {
    ban: 0,
    warn: 1,
    blast_ban: 2
  },

  specialItemType: {
    none: 0,
    special_currency: 1,
    completed_bounty: 2,
    crucible_bounty: 3,
    vanguard_bounty: 4,
    iron_banner_bounty: 5,
    queen_bounty: 6,
    exotic_bounty: 7,
    armor: 8,
    weapon: 9,
    engram: 23,
    consumable: 24,
    exchange_material: 25,
    pvp_ticket: 26,
    mission_reward: 27,
    bounty_reward: 28,
    currency: 29
  },

  statFeedbackState: {
    good: 0,
    too_high: 1,
    too_low: 2,
    wrong_name: 4
  },

  successMessages: {
    following: 1,
    unfollowing: 2,
    managing_group_members: 8,
    updating_settings: 16,
    managing_groups: 32
  },

  surveyCompletionFlags: {
    none: 0,
    user_research_web_page_one: 1,
    user_research_web_page_two: 2
  },

  templateFormat: {
    bnet: 0,
    plain: 1,
    e_mail: 2,
    push: 3
  },

  textParameterSearchType: {
    contains: 0,
    exact: 1,
    starts_with: 2,
    ends_with: 3
  },

  tierType: {
    unknown: 0,
    currency: 1,
    basic: 2,
    common: 3,
    rare: 4,
    superior: 5,
    exotic: 6
  },

  transferStatuses: {
    can_transfer: 0,
    item_is_equipped: 1,
    not_transferrable: 2,
    no_room_in_destination: 4
  },

  unitType: {
    none: 0,
    count: 1,
    per_game: 2,
    seconds: 3,
    points: 4,
    team: 5,
    distance: 6,
    percent: 7,
    ratio: 8,
    boolean: 9,
    weapon_type: 10,
    standing: 11,
    milliseconds: 12
  },

  vendorItemStatus: {
    success: 0,
    no_inventory_space: 1,
    no_funds: 2,
    no_progression: 4,
    no_unlock: 8,
    no_quantity: 16,
    outside_purchase_window: 32,
    not_available: 64,
    uniqueness_violation: 128,
    unknown_error: 256,
    already_selling: 512,
    unsellable: 1024,
    selling_inhibited: 2048,
    already_owned: 4096
  }

};

/**
 * Logger class {@link https://github.com/winstonjs/winston}
 * @type {winston}
 */
BungieNet.logger = new (winston.Logger)({});

BungieNet.Platform = Platform;
BungieNet.Platform.Plugin = Plugin;
