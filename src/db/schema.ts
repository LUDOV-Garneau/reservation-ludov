import {
  mysqlTable,
  mysqlSchema,
  AnyMySqlColumn,
  primaryKey,
  unique,
  int,
  text,
  json,
  tinyint,
  datetime,
  index,
  foreignKey,
  varchar,
  longtext,
  mysqlEnum,
  check,
  date,
  time,
  timestamp,
  mysqlView,
  bigint,
  decimal,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const accessoires = mysqlTable(
  "accessoires",
  {
    id: int().autoincrement().notNull(),
    name: text().notNull(),
    consoles: json().notNull(),
    kohaId: int("koha_id").notNull(),
    hidden: tinyint().default(0).notNull(),
    lastUpdatedAt: datetime({ mode: "string" }).notNull(),
    createdAt: datetime({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "accessoires_id" }),
    unique("id").on(table.id),
    unique("uq_accessoires_koha").on(table.kohaId),
  ],
);

export const consoleStock = mysqlTable(
  "console_stock",
  {
    id: int().autoincrement().notNull(),
    consoleTypeId: int("console_type_id")
      .notNull()
      .references(() => consoleType.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    biblioId: int("biblio_id").notNull(),
    name: varchar({ length: 255 }).notNull(),
    picture: longtext(),
    isActive: tinyint("is_active").default(1).notNull(),
    holding: tinyint().default(0).notNull(),
    createdAt: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    lastUpdatedAt: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_active").on(table.isActive),
    index("idx_console_type").on(table.consoleTypeId),
    index("ix_stock_biblio").on(table.biblioId),
    primaryKey({ columns: [table.id], name: "console_stock_id" }),
    unique("id").on(table.id),
  ],
);

export const consoleType = mysqlTable(
  "console_type",
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    picture: longtext(),
    description: text(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "console_type_id" }),
    unique("id").on(table.id),
    unique("name").on(table.name),
  ],
);

export const cours = mysqlTable(
  "cours",
  {
    id: int().autoincrement().notNull(),
    codeCours: varchar("code_cours", { length: 7 }).notNull(),
    nomCours: varchar("nom_cours", { length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "cours_id" })],
);

export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: int().autoincrement().notNull(),
    reservationId: varchar("reservation_id", { length: 255 }).notNull(),
    emailType: varchar("email_type", { length: 50 }).notNull(),
    recipient: varchar({ length: 255 }),
    status: mysqlEnum(["sent", "failed"]).notNull(),
    errorMessage: text("error_message"),
    createdAt: datetime("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_created").on(table.createdAt),
    index("idx_reservation").on(table.reservationId),
    index("idx_status").on(table.status),
    primaryKey({ columns: [table.id], name: "email_logs_id" }),
  ],
);

export const games = mysqlTable(
  "games",
  {
    id: int().autoincrement().notNull(),
    titre: text().notNull(),
    author: text(),
    platform: varchar({ length: 255 }),
    consoleTypeId: int("console_type_id").references(() => consoleType.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    platformId: int("platform_id"),
    biblioId: int("biblio_id").notNull(),
    consoleKohaId: int("console_koha_id"),
    picture: longtext(),
    holding: tinyint().default(0).notNull(),
    // 0 = jeu non fonctionnel / non disponible dans Koha (zone 583 $9 = 1),
    // posé par le seeder à chaque synchronisation : jamais proposé au parcours.
    isActive: tinyint("is_active").default(1).notNull(),
    requiredAccessories: json("required_accessories"),
    createdAt: datetime({ mode: "string" }).notNull(),
    lastUpdatedAt: datetime({ mode: "string" }).default(
      sql`(CURRENT_TIMESTAMP)`,
    ),
  },
  (table) => [
    index("ix_games_active").on(table.isActive),
    index("ix_games_console_type").on(table.consoleTypeId),
    primaryKey({ columns: [table.id], name: "games_id" }),
    unique("id").on(table.id),
    unique("uq_games_biblio").on(table.biblioId),
  ],
);

export const hourRanges = mysqlTable(
  "hour_ranges",
  {
    rangeId: int("range_id").autoincrement().notNull(),
    weeklyId: int("weekly_id")
      .notNull()
      .references(() => weeklyAvailabilities.weeklyId, { onDelete: "cascade" }),
    startHour: varchar("start_hour", { length: 2 }).notNull(),
    startMinute: varchar("start_minute", { length: 2 }).notNull(),
    endHour: varchar("end_hour", { length: 2 }).notNull(),
    endMinute: varchar("end_minute", { length: 2 }).notNull(),
  },
  (table) => [
    index("weekly_id").on(table.weeklyId),
    primaryKey({ columns: [table.rangeId], name: "hour_ranges_range_id" }),
  ],
);

export const otp = mysqlTable(
  "otp",
  {
    id: int().autoincrement().notNull(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    otpCode: varchar("otp_code", { length: 6 }).notNull(),
    createdAt: datetime("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
    isUsed: tinyint("is_used").default(0).notNull(),
  },
  (table) => [
    index("user_id").on(table.userId),
    primaryKey({ columns: [table.id], name: "otp_id" }),
  ],
);

/**
 * Jetons du parcours « mot de passe oublié » (lien envoyé par courriel).
 *
 * Seul le SHA-256 du jeton est conservé : une fuite de la base ne permet pas
 * de reconstruire les liens en circulation. `created_at` sert aussi au
 * comptage de la limite de débit (3 demandes par compte par heure).
 */
export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int().autoincrement().notNull(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    createdAt: datetime("created_at", { mode: "string" }).notNull(),
    expiresAt: datetime("expires_at", { mode: "string" }).notNull(),
    usedAt: datetime("used_at", { mode: "string" }),
  },
  (table) => [
    index("prt_user_id").on(table.userId),
    primaryKey({ columns: [table.id], name: "password_reset_tokens_id" }),
    unique("password_reset_tokens_token_hash").on(table.tokenHash),
  ],
);

export const policies = mysqlTable(
  "policies",
  {
    id: tinyint().autoincrement().notNull(),
    // 'privacy' = politique de confidentialité, 'usage' = politique d'utilisation
    type: varchar({ length: 32 }).default("privacy").notNull(),
    policies: longtext(),
    lastUpdatedAt: datetime({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "policies_id" }),
    unique("uq_policies_type").on(table.type),
  ],
);

export const docs = mysqlTable(
  "docs",
  {
    // Slugs des tutoriels admin (cours, disponibilites, politique, ...),
    // publics (connexion, effectuer_reservation, ...) et 'markdown-guide'.
    slug: varchar({ length: 50 }).notNull(),
    locale: varchar({ length: 2 }).default("fr").notNull(),
    title: varchar({ length: 255 }).notNull(),
    // Contenu Markdown
    content: longtext().notNull(),
    // 1 = visible sans droits admin (tutoriels publics)
    isPublic: tinyint("is_public").default(0).notNull(),
    updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
    updatedBy: int("updated_by"),
  },
  (table) => [
    primaryKey({ columns: [table.slug, table.locale], name: "docs_pk" }),
  ],
);

export const emailTemplates = mysqlTable(
  "email_templates",
  {
    // confirmation | reminder | reset_password | welcome | otp | cancellation
    templateKey: varchar("template_key", { length: 50 }).notNull(),
    locale: varchar({ length: 2 }).default("fr").notNull(),
    subject: varchar({ length: 255 }).notNull(),
    // Zones de texte nommées insérées dans le gabarit HTML fixe
    zones: json().notNull(),
    updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
    updatedBy: int("updated_by"),
  },
  (table) => [
    primaryKey({
      columns: [table.templateKey, table.locale],
      name: "email_templates_pk",
    }),
  ],
);

export const reservation = mysqlTable(
  "reservation",
  {
    id: varchar({ length: 255 }).notNull(),
    consoleId: int("console_id")
      .notNull()
      .references(() => consoleStock.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    consoleTypeId: int("console_type_id").notNull(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    game1Id: int("game1_id")
      .notNull()
      .references(() => games.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    game2Id: int("game2_id").references(() => games.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    game3Id: int("game3_id").references(() => games.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    accessoryIds: json("accessory_ids"),
    coursId: int("cours_id").notNull(),
    station: int(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    date: date({ mode: "string" }).notNull(),
    time: time().notNull(),
    archived: tinyint().default(0).notNull(),
    cancellationReason: text("cancellation_reason"),
    reminderEnabled: tinyint("reminder_enabled").default(0).notNull(),
    reminderHoursBefore: int("reminder_hours_before"),
    reminderSent: tinyint("reminder_sent").default(0).notNull(),
    reminderSentAt: datetime("reminder_sent_at", { mode: "string" }),
    createdAt: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    lastUpdatedAt: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("idx_reminder_pending").on(
      table.reminderEnabled,
      table.reminderSent,
      table.date,
      table.time,
    ),
    index("ix_res_console").on(table.consoleId),
    index("ix_res_console_type").on(table.consoleTypeId),
    // Filtre de date et tri chronologique de la liste admin (voir 0010).
    index("ix_res_date_time").on(table.date, table.time),
    index("ix_res_cours").on(table.coursId),
    index("ix_res_game1").on(table.game1Id),
    index("ix_res_game2").on(table.game2Id),
    index("ix_res_game3").on(table.game3Id),
    index("ix_res_station").on(table.station),
    index("ix_res_user").on(table.userId),
    primaryKey({ columns: [table.id], name: "reservation_id" }),
    unique("id").on(table.id),
  ],
);

export const reservationHold = mysqlTable(
  "reservation_hold",
  {
    id: varchar({ length: 255 }).notNull(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    consoleId: int("console_id")
      .notNull()
      .references(() => consoleStock.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    consoleTypeId: int("console_type_id").references(() => consoleType.id, {
      onUpdate: "cascade",
    }),
    game1Id: int("game1_id").references(() => games.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    game2Id: int("game2_id").references(() => games.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    game3Id: int("game3_id").references(() => games.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    stationId: int("station_id").references(() => stations.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    accessoirs: json(),
    cours: int(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    date: date({ mode: "string" }),
    time: time(),
    expireAt: timestamp({ mode: "string" }).notNull(),
    createdAt: datetime({ mode: "string" }).notNull(),
  },
  (table) => [
    index("ix_hold_console").on(table.consoleId),
    index("ix_hold_game1").on(table.game1Id),
    index("ix_hold_game2").on(table.game2Id),
    index("ix_hold_game3").on(table.game3Id),
    index("ix_hold_station").on(table.stationId),
    index("ix_hold_user").on(table.userId),
    primaryKey({ columns: [table.id], name: "reservation_hold_id" }),
    unique("id").on(table.id),
  ],
);

export const specificDates = mysqlTable(
  "specific_dates",
  {
    id: int().autoincrement().notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    date: date({ mode: "string" }).notNull(),
    startHour: varchar("start_hour", { length: 2 }).notNull(),
    startMinute: varchar("start_minute", { length: 2 }).notNull(),
    endHour: varchar("end_hour", { length: 2 }).notNull(),
    endMinute: varchar("end_minute", { length: 2 }).notNull(),
    isException: tinyint("is_exception").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "specific_dates_id" })],
);

export const stations = mysqlTable(
  "stations",
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 255 }),
    isActive: tinyint().default(1).notNull(),
    consoles: json().notNull(),
    lastUpdatedAt: datetime({ mode: "string" }).notNull(),
    createdAt: datetime({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "stations_id" }),
    unique("id").on(table.id),
  ],
);

export const users = mysqlTable(
  "users",
  {
    id: int().autoincrement().notNull(),
    firstname: varchar({ length: 50 }).notNull(),
    lastname: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }),
    isAdmin: tinyint().notNull(),
    // Langue des courriels transactionnels ('fr' | 'en')
    preferredLocale: varchar("preferred_locale", { length: 2 })
      .default("fr")
      .notNull(),
    // Incrémentée à chaque réinitialisation de mot de passe : les jetons de
    // session (JWT) portent la valeur au moment de la connexion, ce qui permet
    // d'invalider les sessions ouvertes sur les autres appareils.
    sessionVersion: int("session_version").default(0).notNull(),
    lastUpdatedAt: datetime({ mode: "string" }).notNull(),
    createdAt: datetime({ mode: "string" }).notNull(),
    lastLogin: datetime({ mode: "string" }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "users_id" }),
    unique("id").on(table.id),
    // Le courriel identifie le compte (connexion, import CSV, réinitialisation).
    // Sans cette contrainte, la vérification applicative des routes d'ajout
    // n'est qu'indicative : deux créations concurrentes passent toutes les deux.
    unique("users_email_unique").on(table.email),
  ],
);

export const weeklyAvailabilities = mysqlTable(
  "weekly_availabilities",
  {
    weeklyId: int("weekly_id").autoincrement().notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startDate: date("start_date", { mode: "string" }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endDate: date("end_date", { mode: "string" }),
    dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
    enabled: tinyint().notNull(),
    alwaysAvailable: tinyint("always_available").default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.weeklyId],
      name: "weekly_availabilities_weekly_id",
    }),
  ],
);
export const consoleCatalog = mysqlView("console_catalog", {
  consoleTypeId: int("console_type_id").default(0).notNull(),
  name: varchar({ length: 255 }).notNull(),
  picture: longtext(),
  description: text(),
  totalUnits: bigint("total_units", { mode: "number" }).notNull(),
  activeUnits: decimal("active_units", { precision: 23, scale: 0 }),
  inactiveUnits: decimal("inactive_units", { precision: 23, scale: 0 }),
})
  .algorithm("undefined")
  .sqlSecurity("definer")
  .as(
    sql`select \`ct\`.\`id\` AS \`console_type_id\`,\`ct\`.\`name\` AS \`name\`,\`ct\`.\`picture\` AS \`picture\`,\`ct\`.\`description\` AS \`description\`,count(\`cs\`.\`id\`) AS \`total_units\`,sum((case when ((\`cs\`.\`is_active\` = 1) and (\`cs\`.\`holding\` = 0)) then 1 else 0 end)) AS \`active_units\`,sum((case when (\`cs\`.\`is_active\` = 0) then 1 else 0 end)) AS \`inactive_units\` from (\`ludov_dev\`.\`console_type\` \`ct\` left join \`ludov_dev\`.\`console_stock\` \`cs\` on((\`ct\`.\`id\` = \`cs\`.\`console_type_id\`))) where exists(select 1 from \`ludov_dev\`.\`stations\` \`s\` where json_contains(\`s\`.\`consoles\`,cast(\`ct\`.\`id\` as json),'$')) group by \`ct\`.\`id\`,\`ct\`.\`name\` order by \`ct\`.\`name\``,
  );
