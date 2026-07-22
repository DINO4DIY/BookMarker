import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createKV } from "@/server/lib/create-kv";

const BookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  category: z.string(),
  createdAt: z.number(),
});

export type Bookmark = z.output<typeof BookmarkSchema>;

const kv = createKV<Bookmark>("bookmarker");

const create = os
  .input(
    z.object({
      url: z.string(),
      title: z.string(),
      category: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const id = randomUUID();
    const bookmark: Bookmark = {
      id,
      url: input.url,
      title: input.title,
      category: input.category,
      createdAt: Date.now(),
    };
    await kv.setItem(id, bookmark);
    return bookmark;
  });

const remove = os.input(z.string()).handler(async ({ input }) => {
  await kv.removeItem(input);
});

const list = os.handler(async () => {
  const items = await kv.getAllItems();
  return (items as Bookmark[]).sort((a, b) => b.createdAt - a.createdAt);
});

const listByCategory = os
  .input(z.string())
  .handler(async ({ input }) => {
    const items = await kv.getAllItems();
    return (items as Bookmark[])
      .filter((item) => item.category === input)
      .sort((a, b) => b.createdAt - a.createdAt);
  });

const getCategories = os.handler(async () => {
  const items = await kv.getAllItems();
  const categories = new Set((items as Bookmark[]).map((item) => item.category));
  return Array.from(categories).sort();
});

const live = {
  list: os.handler(async function* ({ signal }) {
    yield call(list, {}, { signal });
    for await (const _ of kv.subscribe()) {
      yield call(list, {}, { signal });
    }
  }),
};

export const router = {
  create,
  remove,
  list,
  listByCategory,
  getCategories,
  live,
};