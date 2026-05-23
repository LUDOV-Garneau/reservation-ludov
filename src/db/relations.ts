import { relations } from "drizzle-orm/relations";
import {
  consoleType,
  consoleStock,
  games,
  weeklyAvailabilities,
  hourRanges,
  users,
  otp,
  reservation,
  reservationHold,
  stations,
} from "./schema";

export const consoleStockRelations = relations(
  consoleStock,
  ({ one, many }) => ({
    consoleType: one(consoleType, {
      fields: [consoleStock.consoleTypeId],
      references: [consoleType.id],
    }),
    reservations: many(reservation),
    reservationHolds: many(reservationHold),
  }),
);

export const consoleTypeRelations = relations(consoleType, ({ many }) => ({
  consoleStocks: many(consoleStock),
  games: many(games),
  reservationHolds: many(reservationHold),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  consoleType: one(consoleType, {
    fields: [games.consoleTypeId],
    references: [consoleType.id],
  }),
  reservations_game1Id: many(reservation, {
    relationName: "reservation_game1Id_games_id",
  }),
  reservations_game2Id: many(reservation, {
    relationName: "reservation_game2Id_games_id",
  }),
  reservations_game3Id: many(reservation, {
    relationName: "reservation_game3Id_games_id",
  }),
  reservationHolds_game1Id: many(reservationHold, {
    relationName: "reservationHold_game1Id_games_id",
  }),
  reservationHolds_game2Id: many(reservationHold, {
    relationName: "reservationHold_game2Id_games_id",
  }),
  reservationHolds_game3Id: many(reservationHold, {
    relationName: "reservationHold_game3Id_games_id",
  }),
}));

export const hourRangesRelations = relations(hourRanges, ({ one }) => ({
  weeklyAvailability: one(weeklyAvailabilities, {
    fields: [hourRanges.weeklyId],
    references: [weeklyAvailabilities.weeklyId],
  }),
}));

export const weeklyAvailabilitiesRelations = relations(
  weeklyAvailabilities,
  ({ many }) => ({
    hourRanges: many(hourRanges),
  }),
);

export const otpRelations = relations(otp, ({ one }) => ({
  user: one(users, {
    fields: [otp.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  otps: many(otp),
  reservations: many(reservation),
  reservationHolds: many(reservationHold),
}));

export const reservationRelations = relations(reservation, ({ one }) => ({
  user: one(users, {
    fields: [reservation.userId],
    references: [users.id],
  }),
  consoleStock: one(consoleStock, {
    fields: [reservation.consoleId],
    references: [consoleStock.id],
  }),
  game_game1Id: one(games, {
    fields: [reservation.game1Id],
    references: [games.id],
    relationName: "reservation_game1Id_games_id",
  }),
  game_game2Id: one(games, {
    fields: [reservation.game2Id],
    references: [games.id],
    relationName: "reservation_game2Id_games_id",
  }),
  game_game3Id: one(games, {
    fields: [reservation.game3Id],
    references: [games.id],
    relationName: "reservation_game3Id_games_id",
  }),
}));

export const reservationHoldRelations = relations(
  reservationHold,
  ({ one }) => ({
    consoleType: one(consoleType, {
      fields: [reservationHold.consoleTypeId],
      references: [consoleType.id],
    }),
    user: one(users, {
      fields: [reservationHold.userId],
      references: [users.id],
    }),
    consoleStock: one(consoleStock, {
      fields: [reservationHold.consoleId],
      references: [consoleStock.id],
    }),
    game_game1Id: one(games, {
      fields: [reservationHold.game1Id],
      references: [games.id],
      relationName: "reservationHold_game1Id_games_id",
    }),
    game_game2Id: one(games, {
      fields: [reservationHold.game2Id],
      references: [games.id],
      relationName: "reservationHold_game2Id_games_id",
    }),
    game_game3Id: one(games, {
      fields: [reservationHold.game3Id],
      references: [games.id],
      relationName: "reservationHold_game3Id_games_id",
    }),
    station: one(stations, {
      fields: [reservationHold.stationId],
      references: [stations.id],
    }),
  }),
);

export const stationsRelations = relations(stations, ({ many }) => ({
  reservationHolds: many(reservationHold),
}));
