import { router as storageRouter } from "./storage";
import { router as categorizeRouter } from "./categorize";

export const bookmarker = {
  storage: storageRouter,
  categorize: categorizeRouter,
};