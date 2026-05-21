"use server";

import { request } from "./fetcher";
import { publishBoardEvent } from "./ably";
import type {
  Card,
  CardDetail,
  CreateCardDto,
  MoveCardDto,
  UpdateCardDto,
} from "../types";

export async function createCard(
  authHeader: Record<string, string>,
  boardId: string,
  columnId: string,
  dto: CreateCardDto,
): Promise<Card> {
  const card = await request<Card>(
    "POST",
    `/columns/${columnId}/cards`,
    { body: dto },
    authHeader,
  );
  const detail = await request<CardDetail>(
    "GET",
    `/cards/${card.id}`,
    {},
    authHeader,
  );
  await publishBoardEvent(boardId, { type: "card:created", card: detail });
  return card;
}

export async function updateCard(
  authHeader: Record<string, string>,
  boardId: string,
  cardId: string,
  dto: UpdateCardDto,
): Promise<CardDetail> {
  await request<CardDetail>(
    "PATCH",
    `/cards/${cardId}`,
    { body: dto },
    authHeader,
  );
  const detail = await request<CardDetail>(
    "GET",
    `/cards/${cardId}`,
    {},
    authHeader,
  );
  await publishBoardEvent(boardId, { type: "card:updated", card: detail });
  return detail;
}

export async function moveCard(
  authHeader: Record<string, string>,
  boardId: string,
  orgId: string,
  cardId: string,
  dto: MoveCardDto,
): Promise<CardDetail> {
  const detail = await request<CardDetail>(
    "PATCH",
    `/cards/${cardId}/move`,
    { body: dto },
    authHeader,
  );
  await publishBoardEvent(boardId, {
    type: "card:moved",
    cardId,
    orgId,
  });
  return detail;
}

export async function deleteCard(
  authHeader: Record<string, string>,
  boardId: string,
  orgId: string,
  cardId: string,
): Promise<null> {
  await request<null>("DELETE", `/cards/${cardId}`, {}, authHeader);
  await publishBoardEvent(boardId, {
    type: "card:deleted",
    cardId,
    orgId,
  });
  return null;
}
