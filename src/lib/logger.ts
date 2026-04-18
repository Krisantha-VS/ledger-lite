type Level = "info" | "warn" | "error"

export function log(level: Level, action: string, data?: Record<string, unknown>): void {
  const entry = { ts: new Date().toISOString(), level, action, ...data }
  if (level === "error") {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}
