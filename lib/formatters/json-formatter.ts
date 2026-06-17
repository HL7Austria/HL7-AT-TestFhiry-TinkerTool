import type { TestScript } from "@/types/fhir-enhanced"
import { cleanEmptySections } from "@/lib/utils"

/**
 * Formatiert beliebige Daten als JSON mit anpassbarer Einrückung
 */
export function formatToJson<T>(data: T, spaces = 2): string {
  try {
    // Wenn es ein TestScript ist, bereinige leere Sektionen
    const dataToFormat = isTestScript(data) ? cleanEmptySections(data) : data
    return JSON.stringify(dataToFormat, null, spaces)
  } catch (error: unknown) {
    console.error("JSON-Formatierungsfehler:", error)
    if (error instanceof Error) {
      throw new Error(`Fehler bei der JSON-Formatierung: ${error.message}`)
    }
    throw new Error(`Fehler bei der JSON-Formatierung: ${String(error)}`)
  }
}

function isTestScript(data: unknown): data is TestScript {
  return typeof data === 'object' && data !== null && 'resourceType' in data && (data as TestScript).resourceType === 'TestScript'
}