// Import types from version-specific modules for better version management
import type {
  FhirOperationOutcome,
  FhirOperationOutcomeIssue,
  FhirTestScript,
  FhirTestScriptMetadata,
  FhirTestScriptMetadataCapability,
  FhirTestScriptMetadataLink,
  FhirTestScriptSetup,
  FhirTestScriptSetupAction,
  FhirTestScriptSetupActionAssert,
  FhirTestScriptSetupActionOperation,
  FhirTestScriptSetupActionAssertRequirement,
  FhirTestScriptTeardown,
  FhirTestScriptTeardownAction,
  FhirTestScriptTest,
  FhirTestScriptTestAction,
  FhirParameters,
  FhirExtension,
  FhirTestScriptOrigin,
  FhirTestScriptDestination,
  FhirTestScriptFixture,
  FhirTestScriptVariable,
  FhirCoding,
  FhirCodeableConcept
} from "./fhir-versions/r5-types"

// Import R5-specific types that might not exist in R4
import type { TestScriptScope as FhirTestScriptScope } from "fhir/r5"


/**
 * Erweiterte FHIR-Typen basierend auf @types/fhir
 * Kombiniert Standard-FHIR-Typen mit projektspezifischen Erweiterungen
 */

export type TestScriptStatus = NonNullable<FhirTestScript["status"]>;

export type TestScriptTest = Omit<FhirTestScriptTest, 'action'> & {
  action?: TestScriptTestAction[];
};

// Action type following FHIR spec: each action has either operation OR assert (singular, not both)
export type TestScriptTestAction = Omit<FhirTestScriptTestAction, 'assert'> & {
  assert?: TestScriptSetupActionAssert;
};

export type TestScriptSetup = FhirTestScriptSetup;
export type TestScriptSetupAction = FhirTestScriptSetupAction;
export type TestScriptSetupActionAssert = FhirTestScriptSetupActionAssert & {
  details?: FhirCodeableConcept;
};
export type TestScriptSetupActionOperation = FhirTestScriptSetupActionOperation;
export type TestScriptTeardown = FhirTestScriptTeardown;
export type TestScriptTeardownAction = FhirTestScriptTeardownAction;
export type TestScriptSetupActionAssertRequirement = FhirTestScriptSetupActionAssertRequirement;
export type TestScriptOrigin = FhirTestScriptOrigin;
export type TestScriptDestination = FhirTestScriptDestination;
export type TestScriptFixture = FhirTestScriptFixture;
export type TestScriptVariable = FhirTestScriptVariable;
export type TestScriptScope = FhirTestScriptScope;

export type TestScriptMetadata = FhirTestScriptMetadata;
export type TestScriptCapability = FhirTestScriptMetadataCapability;
export type TestScriptMetadataCapability = FhirTestScriptMetadataCapability;
export type TestScriptMetadataLink = FhirTestScriptMetadataLink;

export type EnhancedTestScriptOperation = FhirTestScriptSetupActionOperation;
export type EnhancedTestScriptAssert = FhirTestScriptSetupActionAssert;

export interface TestSystem {
  index: number;
  title: string;
  actor?: string[];
  description?: string;
  url?: string;
}

export interface TestScriptCommonParameter {
  name?: string;
  value?: string;
}

export interface TestScriptProfile {
  id: string;
  reference: string;
}

export interface TestScriptCommon {
  key: string;
  name?: string;
  description?: string;
  parameter?: TestScriptCommonParameter[];
  action: TestScriptTestAction[];
}

export type TestScript = Omit<FhirTestScript, 'test' | 'profile'> & {
  test?: TestScriptTest[];
  testSystem?: TestSystem[];
  common?: TestScriptCommon[];
  profile?: TestScriptProfile[];
};

export type OperationOutcome = FhirOperationOutcome;
export type OperationOutcomeIssue = FhirOperationOutcomeIssue;

export interface ValidationIssue extends FhirOperationOutcomeIssue {
  line?: number;
  column?: number;
  constraintName?: string; // Z.B. "tst-7", "tst-8" - extrahiert aus details.coding.code
}

export type ValidationResult = Omit<FhirOperationOutcome, "issue"> & {
  issue: ValidationIssue[];
};

export type Parameters = FhirParameters;

export type Extension = FhirExtension;

export type Coding = FhirCoding;

export type CodeableConcept = FhirCodeableConcept;

// Define commonly used Enum types as string unions (consistent across FHIR versions)
export type TestScriptSetupActionAssertDirection = "request" | "response"
export type TestScriptSetupActionAssertOperator = "equals" | "notEquals" | "in" | "notIn" | "greaterThan" | "lessThan" | "empty" | "notEmpty" | "contains" | "notContains" | "eval" | "manualEval"
export type TestScriptSetupActionAssertResponse = "continue" | "switchingProtocols" | "okay" | "created" | "accepted" | "nonAuthoritativeInformation" | "noContent" | "resetContent" | "partialContent" | "multipleChoices" | "movedPermanently" | "found" | "seeOther" | "notModified" | "useProxy" | "temporaryRedirect" | "permanentRedirect" | "badRequest" | "unauthorized" | "paymentRequired" | "forbidden" | "notFound" | "methodNotAllowed" | "notAcceptable" | "proxyAuthenticationRequired" | "requestTimeout" | "conflict" | "gone" | "lengthRequired" | "preconditionFailed" | "contentTooLarge" | "uriTooLong" | "unsupportedMediaType" | "rangeNotSatisfiable" | "expectationFailed" | "misdirectedRequest" | "unprocessableContent" | "upgradeRequired" | "internalServerError" | "notImplemented" | "badGateway" | "serviceUnavailable" | "gatewayTimeout" | "httpVersionNotSupported"
export type TestScriptSetupActionOperationMethod = "head" | "get" | "post" | "put" | "patch" | "delete" | "options"
