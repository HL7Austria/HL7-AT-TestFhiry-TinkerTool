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
export function parseJsonTestScript(jsonContent: string): ImportResult {
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
 * Konvertiert XML zu JSON und parst dann das TestScript
 * Verwendet fhir-tool für FHIR-konforme XML-Konvertierung
 */
export function parseXmlTestScript(xmlContent: string): ImportResult {
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

    // Enrich with default values to preserve 1:1 fidelity
    enrichWithDefaults(jsonContent)

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
function enrichWithDefaults(testScript: TestScript): void {
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

  addStopTestOnFail(testScript)

  // Add value attribute to profile elements if reference is present
  if (testScript.profile && Array.isArray(testScript.profile)) {
    testScript.profile.forEach((profile: any) => {
      if (profile.id === "patient-profile" && !profile.value) {
        profile.value = "http://hl7.org/fhir/StructureDefinition/Patient"
      }
    })
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

  let parseResult: ImportResult

  // Detect format primarily based on content, not filename
  if (trimmedContent.startsWith("{") || trimmedContent.startsWith("[")) {
    // JSON format detected
    parseResult = parseJsonTestScript(fileContent)
  } else if (trimmedContent.startsWith("<")) {
    // XML format detected
    parseResult = parseXmlTestScript(fileContent)
  } else {
    // Try both formats, starting with JSON
    parseResult = parseJsonTestScript(fileContent)
    if (!parseResult.success) {
      // If JSON fails, try XML
      parseResult = parseXmlTestScript(fileContent)
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

