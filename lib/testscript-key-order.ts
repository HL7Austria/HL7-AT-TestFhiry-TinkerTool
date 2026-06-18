import type { TestScript } from "@/types/fhir-enhanced"

/**
 * FHIR R5 TestScript kanonische Schlüsselreihenfolge
 * Basiert auf: http://hl7.org/fhir/R5/testscript.html
 *
 * Jede Map definiert die Reihenfolge der Keys für das jeweilige Objekt.
 * Keys die nicht in der Map enthalten sind, werden am Ende angehängt (in ihrer ursprünglichen Reihenfolge).
 */

// Top-level TestScript key order
const TESTSCRIPT_KEY_ORDER: string[] = [
  // from Resource
  "resourceType",
  "id",
  "meta",
  "implicitRules",
  "language",
  // from DomainResource
  "text",
  "contained",
  "extension",
  "modifierExtension",
  // TestScript-specific
  "url",
  "identifier",
  "version",
  "versionAlgorithmString",
  "versionAlgorithmCoding",
  "name",
  "title",
  "status",
  "experimental",
  "date",
  "publisher",
  "contact",
  "description",
  "useContext",
  "jurisdiction",
  "purpose",
  "copyright",
  "copyrightLabel",
  "origin",
  "destination",
  "metadata",
  "scope",
  "fixture",
  "profile",
  "variable",
  "setup",
  "test",
  "teardown",
  // Project-specific extensions (not in FHIR spec, appended at end)
  "testSystem",
]

// Origin key order
const ORIGIN_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "index",
  "profile",
  "url",
]

// Destination key order
const DESTINATION_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "index",
  "profile",
  "url",
]

// Metadata key order
const METADATA_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "link",
  "capability",
]

// Metadata link key order
const METADATA_LINK_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "url",
  "description",
]

// Metadata capability key order
const METADATA_CAPABILITY_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "required",
  "validated",
  "description",
  "origin",
  "destination",
  "link",
  "capabilities",
]

// Scope key order
const SCOPE_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "artifact",
  "conformance",
  "phase",
]

// Fixture key order
const FIXTURE_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "autocreate",
  "autodelete",
  "resource",
]

// Variable key order
const VARIABLE_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "name",
  "defaultValue",
  "description",
  "expression",
  "headerField",
  "hint",
  "path",
  "sourceId",
]

// Setup key order
const SETUP_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "action",
]

// Setup/Test action key order
const ACTION_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "operation",
  "assert",
]

// Operation key order
const OPERATION_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "type",
  "resource",
  "label",
  "description",
  "accept",
  "contentType",
  "destination",
  "encodeRequestUrl",
  "method",
  "origin",
  "params",
  "requestHeader",
  "requestId",
  "responseId",
  "sourceId",
  "targetId",
  "url",
]

// Request header key order
const REQUEST_HEADER_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "field",
  "value",
]

// Assert key order
const ASSERT_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "label",
  "description",
  "direction",
  "compareToSourceId",
  "compareToSourceExpression",
  "compareToSourcePath",
  "contentType",
  "defaultManualCompletion",
  "expression",
  "headerField",
  "minimumId",
  "navigationLinks",
  "operator",
  "path",
  "requestMethod",
  "requestURL",
  "resource",
  "response",
  "responseCode",
  "sourceId",
  "stopTestOnFail",
  "validateProfileId",
  "value",
  "warningOnly",
  "requirement",
]

// Assert requirement key order
const ASSERT_REQUIREMENT_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "linkUri",
  "linkCanonical",
]

// Test key order
const TEST_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "name",
  "description",
  "action",
]

// Teardown key order
const TEARDOWN_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "action",
]

// Teardown action key order (only operation, no assert)
const TEARDOWN_ACTION_KEY_ORDER: string[] = [
  "id",
  "extension",
  "modifierExtension",
  "operation",
]

/**
 * Ordnet ein Objekt nach der angegebenen Schlüsselreihenfolge.
 * Keys die in der Order-Liste fehlen, werden am Ende angehängt.
 * undefined-Werte werden übersprungen.
 */
function orderObject<T extends Record<string, unknown>>(obj: T, keyOrder: string[]): T {
  const result = {} as Record<string, unknown>

  // Zuerst alle Keys aus der definierten Reihenfolge
  for (const key of keyOrder) {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }

  // Dann alle übrigen Keys, die nicht in der Order-Liste stehen
  for (const key of Object.keys(obj)) {
    if (!(key in result) && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }

  return result as T
}

/**
 * Ordnet ein Array von Objekten nach der angegebenen Schlüsselreihenfolge.
 */
function orderArray<T extends Record<string, unknown>>(
  arr: T[] | undefined,
  keyOrder: string[],
  childOrderer?: (item: T) => T
): T[] | undefined {
  if (!arr || arr.length === 0) return arr
  return arr.map(item => {
    const ordered = orderObject(item, keyOrder)
    return childOrderer ? childOrderer(ordered) : ordered
  })
}

/**
 * Ordnet eine einzelne Operation nach der FHIR-Reihenfolge.
 */
function orderOperation(op: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderObject(op, OPERATION_KEY_ORDER)
  if (ordered.requestHeader && Array.isArray(ordered.requestHeader)) {
    ordered.requestHeader = orderArray(
      ordered.requestHeader as Record<string, unknown>[],
      REQUEST_HEADER_KEY_ORDER
    )
  }
  return ordered
}

/**
 * Ordnet eine einzelne Assert nach der FHIR-Reihenfolge.
 */
function orderAssert(assertion: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderObject(assertion, ASSERT_KEY_ORDER)
  if (ordered.requirement && Array.isArray(ordered.requirement)) {
    ordered.requirement = orderArray(
      ordered.requirement as Record<string, unknown>[],
      ASSERT_REQUIREMENT_KEY_ORDER
    )
  }
  return ordered
}

/**
 * Ordnet eine Setup/Test-Action nach der FHIR-Reihenfolge.
 */
function orderAction(action: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderObject(action, ACTION_KEY_ORDER)
  if (ordered.operation) {
    ordered.operation = orderOperation(ordered.operation as Record<string, unknown>)
  }
  if (ordered.assert) {
    ordered.assert = orderAssert(ordered.assert as Record<string, unknown>)
  }
  return ordered
}

/**
 * Ordnet eine Teardown-Action nach der FHIR-Reihenfolge.
 */
function orderTeardownAction(action: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderObject(action, TEARDOWN_ACTION_KEY_ORDER)
  if (ordered.operation) {
    ordered.operation = orderOperation(ordered.operation as Record<string, unknown>)
  }
  return ordered
}

/**
 * Ordnet Metadata nach der FHIR-Reihenfolge.
 */
function orderMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderObject(metadata, METADATA_KEY_ORDER)
  if (ordered.link && Array.isArray(ordered.link)) {
    ordered.link = orderArray(
      ordered.link as Record<string, unknown>[],
      METADATA_LINK_KEY_ORDER
    )
  }
  if (ordered.capability && Array.isArray(ordered.capability)) {
    ordered.capability = orderArray(
      ordered.capability as Record<string, unknown>[],
      METADATA_CAPABILITY_KEY_ORDER
    )
  }
  return ordered
}

/**
 * Ordnet ein vollständiges TestScript-Objekt in die FHIR-kanonische Schlüsselreihenfolge.
 * Rekursiv für alle verschachtelten Objekte (operation, assert, metadata, etc.).
 */
export function orderTestScriptKeys(testScript: TestScript): TestScript {
  const ordered = orderObject(
    testScript as unknown as Record<string, unknown>,
    TESTSCRIPT_KEY_ORDER
  ) as Record<string, unknown>

  // Origin
  if (ordered.origin && Array.isArray(ordered.origin)) {
    ordered.origin = orderArray(
      ordered.origin as Record<string, unknown>[],
      ORIGIN_KEY_ORDER
    )
  }

  // Destination
  if (ordered.destination && Array.isArray(ordered.destination)) {
    ordered.destination = orderArray(
      ordered.destination as Record<string, unknown>[],
      DESTINATION_KEY_ORDER
    )
  }

  // Metadata
  if (ordered.metadata) {
    ordered.metadata = orderMetadata(ordered.metadata as Record<string, unknown>)
  }

  // Scope
  if (ordered.scope && Array.isArray(ordered.scope)) {
    ordered.scope = orderArray(
      ordered.scope as Record<string, unknown>[],
      SCOPE_KEY_ORDER
    )
  }

  // Fixture
  if (ordered.fixture && Array.isArray(ordered.fixture)) {
    ordered.fixture = orderArray(
      ordered.fixture as Record<string, unknown>[],
      FIXTURE_KEY_ORDER
    )
  }

  // Variable
  if (ordered.variable && Array.isArray(ordered.variable)) {
    ordered.variable = orderArray(
      ordered.variable as Record<string, unknown>[],
      VARIABLE_KEY_ORDER
    )
  }

  // Setup
  if (ordered.setup) {
    const setup = orderObject(
      ordered.setup as Record<string, unknown>,
      SETUP_KEY_ORDER
    )
    if (setup.action && Array.isArray(setup.action)) {
      setup.action = (setup.action as Record<string, unknown>[]).map(orderAction)
    }
    ordered.setup = setup
  }

  // Test
  if (ordered.test && Array.isArray(ordered.test)) {
    ordered.test = (ordered.test as Record<string, unknown>[]).map(test => {
      const orderedTest = orderObject(test, TEST_KEY_ORDER)
      if (orderedTest.action && Array.isArray(orderedTest.action)) {
        orderedTest.action = (orderedTest.action as Record<string, unknown>[]).map(orderAction)
      }
      return orderedTest
    })
  }

  // Teardown
  if (ordered.teardown) {
    const teardown = orderObject(
      ordered.teardown as Record<string, unknown>,
      TEARDOWN_KEY_ORDER
    )
    if (teardown.action && Array.isArray(teardown.action)) {
      teardown.action = (teardown.action as Record<string, unknown>[]).map(orderTeardownAction)
    }
    ordered.teardown = teardown
  }

  return ordered as unknown as TestScript
}
