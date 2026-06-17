import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TestScript } from "@/types/fhir-enhanced"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Entfernt leere setup, teardown und test Sektionen aus einem TestScript
 */
export function cleanEmptySections(testScript: TestScript): TestScript {
  const cleaned = { ...testScript }

  // Entferne setup wenn action leer ist
  if (cleaned.setup && Array.isArray(cleaned.setup.action) && cleaned.setup.action.length === 0) {
    delete cleaned.setup
  }

  // Entferne teardown wenn action leer ist
  if (cleaned.teardown && Array.isArray(cleaned.teardown.action) && cleaned.teardown.action.length === 0) {
    delete cleaned.teardown
  }

  // Entferne test wenn das Array leer ist
  if (cleaned.test && Array.isArray(cleaned.test) && cleaned.test.length === 0) {
    delete cleaned.test
  }

  // Entferne leere test cases aus dem test array
  if (cleaned.test && Array.isArray(cleaned.test)) {
    cleaned.test = cleaned.test.filter(testCase => {
      if (!testCase.action || !Array.isArray(testCase.action) || testCase.action.length === 0) {
        return false
      }
      return true
    })

    // Wenn nach dem Filtern keine tests mehr übrig sind, entferne das gesamte test array
    if (cleaned.test.length === 0) {
      delete cleaned.test
    }
  }

  return cleaned
}
