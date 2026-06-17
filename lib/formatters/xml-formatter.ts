import { Fhir } from "fhir-tool"
import type { TestScript } from "@/types/fhir-enhanced"
import { cleanEmptySections } from "@/lib/utils"

/**
 * Enrichert TestScript mit Standardwerten für XML-Export
 */
function enrichWithDefaults(testScript: TestScript): TestScript {
  const enriched = JSON.parse(JSON.stringify(testScript)) as TestScript

  // Add default stopTestOnFail to all assert elements
  const addStopTestOnFail = (obj: any): void => {
    if (typeof obj !== 'object' || obj === null) return

    if (obj.assert && typeof obj.assert === 'object') {
      // Always set stopTestOnFail to false if not already set
      if (obj.assert.stopTestOnFail === undefined || obj.assert.stopTestOnFail === null) {
        obj.assert.stopTestOnFail = false
      }
    }

    Object.values(obj).forEach((value) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(addStopTestOnFail)
        } else {
          addStopTestOnFail(value)
        }
      }
    })
  }

  addStopTestOnFail(enriched)

  // Add value attribute to profile elements if reference is present
  if (enriched.profile && Array.isArray(enriched.profile)) {
    enriched.profile.forEach((profile: any) => {
      if (profile.reference && !profile.value) {
        profile.value = profile.reference
      }
    })
  }

  return enriched
}

/**
 * Formatiert XML mit Pretty-Print
 * Behält den gesamten Inhalt von <text>-Elementen in einer Zeile
 */
function formatXml(xml: string): string {
  const tab = "  "

  // Extract text elements and replace them with placeholders
  const textElements: string[] = []
  let processedXml = xml.replace(/<text[^>]*>[\s\S]*?<\/text>/g, (match) => {
    textElements.push(match)
    return `__TEXT_ELEMENT_${textElements.length - 1}__`
  })

  // Format the XML without text elements
  let formatted = ""
  let indent = 0

  // Split by tags
  const tokens = processedXml.split(/(<[^>]+>)/g).filter(t => t.trim())

  for (const token of tokens) {
    if (token.trim() === "") continue

    if (token.match(/^<\//)) {
      // Closing tag
      indent = Math.max(0, indent - 1)
      formatted += tab.repeat(indent) + token + "\n"
    } else if (token.match(/^<[^/!?]/)) {
      // Opening tag (not self-closing, not declaration, not comment)
      if (token.match(/\/>$/)) {
        // Self-closing tag
        formatted += tab.repeat(indent) + token + "\n"
      } else {
        formatted += tab.repeat(indent) + token + "\n"
        indent++
      }
    } else if (token.match(/^<\?/)) {
      // XML declaration
      formatted += token + "\n"
    } else if (token.match(/^__TEXT_ELEMENT_\d+__$/)) {
      // Placeholder for text element
      const index = parseInt(token.match(/__TEXT_ELEMENT_(\d+)__/)?.[1] || "0")
      formatted += tab.repeat(indent) + textElements[index] + "\n"
    } else {
      // Text content
      formatted += tab.repeat(indent) + token.trim() + "\n"
    }
  }

  return formatted.trim()
}

/**
 * Fügt stopTestOnFail="false" zu allen assert-Elementen hinzu, die dieses Attribut nicht haben
 */
function addStopTestOnFailToXml(xml: string): string {
  // Add stopTestOnFail="false" to <assert> elements that don't have it
  let result = xml.replace(/<assert([^>]*)>/g, (match, attrs) => {
    if (!attrs.includes('stopTestOnFail')) {
      // Add stopTestOnFail before the closing >
      return `<assert${attrs} stopTestOnFail="false">`
    }
    return match
  })

  // Add value attribute to <profile> elements with id="patient-profile"
  result = result.replace(/<profile id="patient-profile"([^>]*)>/g, (match, attrs) => {
    if (!attrs.includes('value')) {
      // Check if it's a self-closing tag
      if (attrs.trim().endsWith('/')) {
        // Remove the trailing / and add both attributes
        const attrsWithoutSlash = attrs.trim().slice(0, -1)
        return `<profile id="patient-profile"${attrsWithoutSlash} value="http://hl7.org/fhir/StructureDefinition/Patient"/>`
      }
      return `<profile id="patient-profile"${attrs} value="http://hl7.org/fhir/StructureDefinition/Patient">`
    }
    return match
  })

  return result
}

/**
 * Formatiert ein TestScript-Objekt als XML
 * Verwendet fhir-tool für FHIR-konforme XML-Konvertierung
 */
export function formatToXml(testScript: TestScript): string {
  try {
    // Bereinige leere Sektionen vor der Serialisierung
    const cleanedTestScript = cleanEmptySections(testScript)

    // Enrich with default values
    const enrichedTestScript = enrichWithDefaults(cleanedTestScript)

    const fhir = new Fhir()
    const xmlContent = fhir.objToXml(enrichedTestScript)

    // Apply pretty-print formatting
    const formattedXml = formatXml(xmlContent)

    // Add stopTestOnFail to assert elements
    return addStopTestOnFailToXml(formattedXml)
  } catch (error: unknown) {
    console.error("XML-Formatierungsfehler:", error)
    if (error instanceof Error) {
      throw new Error(`Fehler bei der XML-Formatierung: ${error.message}`)
    }
    throw new Error(`Fehler bei der XML-Formatierung: ${String(error)}`)
  }
}
