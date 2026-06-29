import type { TestScript, OperationOutcome } from "@/types/fhir-enhanced"
import { Fhir } from "fhir-tool"

export interface ImportResult {
  success: boolean
  testScript?: TestScript
  errors?: string[]
  validationResult?: OperationOutcome
}

/**
 * Parst eine JSON-Datei zu einem TestScript
 */
export function parseJsonTestScript(jsonContent: string, isR5?: boolean): ImportResult {
  try {
    const parsed = JSON.parse(jsonContent) as unknown

    // Prüfe grundlegende Struktur
    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        errors: ["Invalid JSON format"],
      }
    }

    const testScript = parsed as TestScript

    // Check if it's a TestScript
    if (testScript.resourceType !== "TestScript") {
      return {
        success: false,
        errors: [`Invalid ResourceType: ${testScript.resourceType}. Expected: TestScript`],
      }
    }

    // Reorder fields to put profile and _profile next to each other
    reorderProfileFields(testScript)

    if (isR5 !== undefined) {
      enrichWithDefaults(testScript, isR5)
    }

    return {
      success: true,
      testScript,
    }
  } catch (error) {
    return {
      success: false,
      errors: [`JSON parsing error: ${error instanceof Error ? error.message : String(error)}`],
    }
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

/**
 * Konvertiert XML zu JSON und parst dann das TestScript
 * Verwendet fhir-tool für FHIR-konforme XML-Konvertierung
 */
export function parseXmlTestScript(xmlContent: string, isR5?: boolean): ImportResult {
  try {
    const fhir = new Fhir()
    const jsonContent = fhir.xmlToObj(xmlContent) as TestScript

    // Check if it's a TestScript
    if (jsonContent.resourceType !== "TestScript") {
      return {
        success: false,
        errors: [`Invalid ResourceType: ${jsonContent.resourceType}. Expected: TestScript`],
      }
    }

    // Reorder fields to put profile and _profile next to each other
    reorderProfileFields(jsonContent)

    // Enrich with default values to preserve 1:1 fidelity
    enrichWithDefaults(jsonContent, isR5 ?? true)

    return {
      success: true,
      testScript: jsonContent,
    }
  } catch (error) {
    return {
      success: false,
      errors: [`XML parsing error: ${error instanceof Error ? error.message : String(error)}`],
    }
  }
}

/**
 * Enrichert TestScript mit Standardwerten für 1:1 Import/Export
 */
function enrichWithDefaults(testScript: TestScript, isR5: boolean): void {
  const handleStopTestOnFail = (obj: any): void => {
    if (typeof obj !== 'object' || obj === null) return

    if (obj.assert && typeof obj.assert === 'object') {
      if (isR5) {
        if (obj.assert.stopTestOnFail === undefined || obj.assert.stopTestOnFail === null) {
          obj.assert.stopTestOnFail = false
        }
      } else {
        delete obj.assert.stopTestOnFail
      }
    }

    Object.values(obj).forEach((value) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(handleStopTestOnFail)
        } else {
          handleStopTestOnFail(value)
        }
      }
    })
  }

  handleStopTestOnFail(testScript)

  // Handle profile in different FHIR formats:
  // 1. Split format: profile (strings) + _profile (objects with id)
  // 2. Consolidated format: profile (objects with id and reference)
  if (testScript.profile && Array.isArray(testScript.profile)) {
    // Check if profile is split (strings in profile, objects in _profile)
    if (testScript._profile && Array.isArray(testScript._profile)) {
      const profileUrls = testScript.profile as unknown as string[]
      const profileExtensions = testScript._profile as unknown as any[]

      // Merge into consolidated format
      testScript.profile = profileUrls.map((url: string, idx: number) => {
        const extension = profileExtensions[idx]
        return {
          id: extension?.id || `profile-${idx}`,
          reference: url,
        }
      }) as any

      // Remove _profile after merging
      delete testScript._profile
    } else {
      // Handle consolidated format: add value attribute if reference is present
      testScript.profile.forEach((profile: any) => {
        if (profile.id === "patient-profile" && !profile.value) {
          profile.value = "http://hl7.org/fhir/StructureDefinition/Patient"
        }
      })
    }
  }
}

/**
 * Validiert ein TestScript über die API
 */
export async function validateImportedTestScript(
  testScript: TestScript,
  fhirVersion?: string | { toString(): string }
): Promise<OperationOutcome | null> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Validation-Mode": "import", // Lockere Validierung für Import
    }

    if (fhirVersion) {
      headers["X-FHIR-Version"] = typeof fhirVersion === "string" ? fhirVersion : fhirVersion.toString()
    }

    const response = await fetch("/api/validate", {
      method: "POST",
      headers,
      body: JSON.stringify(testScript),
    })

    if (!response.ok) {
      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "exception",
            diagnostics: `Validation error: ${response.status} ${response.statusText}`,
          },
        ],
      }
    }

    return (await response.json()) as OperationOutcome
  } catch (error) {
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    }
  }
}

/**
 * Liest eine Datei und erkennt automatisch das Format (JSON oder XML)
 */
export async function importTestScriptFromFile(
  file: File,
  fhirVersion?: string | { toString(): string }
): Promise<ImportResult> {
  const fileContent = await file.text()
  const trimmedContent = fileContent.trim()
  const isR5 = fhirVersion ? fhirVersion.toString() === "R5" : false

  let parseResult: ImportResult

  // Detect format primarily based on content, not filename
  if (trimmedContent.startsWith("{") || trimmedContent.startsWith("[")) {
    // JSON format detected
    parseResult = parseJsonTestScript(fileContent, isR5)
  } else if (trimmedContent.startsWith("<")) {
    // XML format detected
    parseResult = parseXmlTestScript(fileContent, isR5)
  } else {
    // Try both formats, starting with JSON
    parseResult = parseJsonTestScript(fileContent, isR5)
    if (!parseResult.success) {
      // If JSON fails, try XML
      parseResult = parseXmlTestScript(fileContent, isR5)
    }
    
    // If both fail, return error
    if (!parseResult.success) {
      return {
        success: false,
        errors: ["Unknown file format. The file must contain valid JSON or XML."],
      }
    }
  }

  // If parsing failed, return error
  if (!parseResult.success || !parseResult.testScript) {
    return parseResult
  }

  // Validate the imported TestScript (with lenient import validation)
  const validationResult = await validateImportedTestScript(parseResult.testScript, fhirVersion)

  // Check if there are critical errors
  if (validationResult && validationResult.issue && validationResult.issue.length > 0) {
    const hasErrors = validationResult.issue.some(
      (issue) => issue.severity === "error" || issue.severity === "fatal"
    )

    if (hasErrors) {
      // There are errors, import fails
      return {
        success: false,
        testScript: parseResult.testScript,
        validationResult,
        errors: validationResult.issue
          .filter((issue) => issue.severity === "error" || issue.severity === "fatal")
          .map((issue) => `${issue.severity}: ${issue.diagnostics || issue.code}`),
      }
    }

    // Only warnings present - import successful
    return {
      success: true,
      testScript: parseResult.testScript,
      validationResult,
    }
  }

  return {
    success: true,
    testScript: parseResult.testScript,
    validationResult: validationResult || undefined,
  }
}

