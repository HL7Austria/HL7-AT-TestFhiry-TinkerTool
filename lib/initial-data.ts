import type { TestScript } from "@/types/fhir-enhanced"

/**
 * Minimales, aber vollständig valides TestScript basierend auf FHIR R5 JSON Schema
 * Erfüllt alle FHIR-Constraints und verwendet nur erforderliche Felder
 * 
 * Basiert auf: http://hl7.org/fhir/json-schema/TestScript
 */
export const initialTestScript: TestScript = {
  resourceType: "TestScript",
  url: "http://example.org/fhir/TestScript/MinimalTestScript",
  name: "MinimalTestScript",
  title: "Minimales TestScript",
  status: "draft",
  date: "2024-01-15T10:00:00.000Z",
  publisher: "Tinker Tool - FHIR TestScript Builder",
  description: "Ein minimales, aber valides FHIR TestScript für Validierungszwecke.",
  destination: [
    {
      index: 1,
      profile: {
        system: "http://hl7.org/fhir/testscript-profile-destination-types",
        code: "FHIR-Server"
      }
    }
  ],
  metadata: {
    capability: [
      {
        required: true,
        validated: false,
        description: "Basis FHIR Server Capabilities",
        capabilities: "http://hl7.org/fhir/CapabilityStatement/base"
      }
    ]
  },
  fixture: [
    {
      id: "patient-fixture",
      autocreate: false,
      autodelete: false,
      resource: {
        reference: "Patient/example"
      }
    }
  ],
  test: [
    {
      id: "minimal-test-1",
      name: "Patient Ressource laden",
      description: "Validiert, dass der Server die Beispiel-Patientenressource bereitstellt.",
      action: [
        {
          operation: {
            type: {
              system: "http://hl7.org/fhir/restful-interaction",
              code: "read"
            },
            resource: "Patient",
            label: "Patient laden",
            description: "Führt eine READ-Operation für den Beispiel-Patienten aus.",
            encodeRequestUrl: true,
            method: "get",
            params: "_format=json",
            requestHeader: [
              {
                field: "Accept",
                value: "application/fhir+json"
              }
            ],
            sourceId: "patient-fixture",
            targetId: "1",
            url: "/Patient/example"
          }
        }
      ]
    }
  ]
}
