import { api } from "./client";

export function getSchedules() {
  return api.get("/v1/trips");
}