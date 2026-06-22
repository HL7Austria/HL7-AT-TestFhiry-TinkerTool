import type { TestScript } from "@/types/fhir-enhanced"
import { cleanEmptySections } from "@/lib/utils"

/**
 * Formatiert beliebige Daten als JSON mit anpassbarer Einrückung
 */
export function formatToJson<T>(data: T, spaces = 2): string {
  try {
    // Wenn es ein TestScript ist, bereinige leere Sektionen
    const dataToFormat = isTestScript(data) ? cleanEmptySections(data) : data

    // Reorder fields to put profile and _profile next to each other
    if (isTestScript(dataToFormat)) {
      reorderProfileFields(dataToFormat)
    }

    return JSON.stringify(dataToFormat, null, spaces)
  } catch (error: unknown) {
    console.error("JSON-Formatierungsfehler:", error)
    if (error instanceof Error) {
      throw new Error(`Fehler bei der JSON-Formatierung: ${error.message}`)
    }
    throw new Error(`Fehler bei der JSON-Formatierung: ${String(error)}`)
  }
}

/**
 * Reorders object fields to put profile and _profile next to each other
 */
function reorderProfileFields(obj: any): void {
  if (!obj || typeof obj !== 'object') return

  // If this object has both profile and _profile, reorder them to be adjacent
  if (obj.profile !== undefined && obj._profile !== undefined) {
    const profileValue = obj.profile
    const _profileValue = obj._profile

    // Create new object with profile and _profile adjacent
    const newObj: any = {}
    Object.keys(obj).forEach(key => {
      if (key === 'profile') {
        newObj.profile = profileValue
        newObj._profile = _profileValue
      } else if (key !== '_profile') {
        newObj[key] = obj[key]
      }
    })

    // Replace original object
    Object.keys(obj).forEach(key => delete obj[key])
    Object.keys(newObj).forEach(key => obj[key] = newObj[key])
  }

  // Recursively process nested objects
  Object.values(obj).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(reorderProfileFields)
      } else {
        reorderProfileFields(value)
      }
    }
  })
}

function isTestScript(data: unknown): data is TestScript {
  return typeof data === 'object' && data !== null && 'resourceType' in data && (data as TestScript).resourceType === 'TestScript'
}