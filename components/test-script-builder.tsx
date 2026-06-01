"use client"

import { useState, useCallback, useMemo } from "react"
import FormBuilder from "@/components/form-builder/form-builder"
import { HeaderSection } from "./test-script-builder/header-section"
import { OutputSection } from "./test-script-builder/output-section"
import type { TestScript, TestScriptStatus } from "@/types/fhir-enhanced"
import { initialTestScript } from "@/lib/initial-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { orderTestScriptKeys } from "@/lib/testscript-key-order"

/**
 * Main TestScript Builder component that manages the overall state and layout
 * Optimized with modern React patterns and better type safety
 */
export function TestScriptBuilder() {
  // State for the TestScript data with proper typing
  const [testScript, setTestScript] = useState<TestScript>(initialTestScript)

  /**
   * Updates the TestScript data with new values using functional updates
   * @param newData - Partial TestScript data to merge with the current state
   */
  const updateTestScript = useCallback((newData: Partial<TestScript>) => {
    setTestScript((prev) => orderTestScriptKeys({ ...prev, ...newData }))
  }, [])

  /**
   * Updates a specific section of the TestScript with type safety
   * @param section - The section to update (e.g., 'metadata', 'setup')
   * @param data - The new data for the section
   */
  const updateSection = useCallback(<K extends keyof TestScript>(
    section: K, 
    data: TestScript[K]
  ) => {
    setTestScript((prev) => orderTestScriptKeys({
      ...prev,
      [section]: data,
    }))
  }, [])

  /**
   * Validates the current TestScript state
   */
  const isValidTestScript = useMemo(() => {
    return !!(
      testScript.resourceType === "TestScript" &&
      testScript.name &&
      testScript.status &&
      testScript.url
    )
  }, [testScript])

  /**
   * Gets the status badge variant based on the current status
   */
  const getStatusBadgeVariant = useCallback((status: TestScriptStatus) => {
    switch (status) {
      case 'active':
        return 'default' as const
      case 'draft':
        return 'secondary' as const
      case 'retired':
        return 'destructive' as const
      case 'unknown':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }, [])

  /**
   * Resets the TestScript to the initial state
   */
  const handleClear = useCallback(() => {
    setTestScript(initialTestScript)
  }, [])

  return (
    <div className="space-y-8">
      <HeaderSection 
        testScript={testScript}
        isValidTestScript={isValidTestScript}
        getStatusBadgeVariant={getStatusBadgeVariant}
        onImport={(importedScript) => setTestScript(orderTestScriptKeys(importedScript))}
        onClear={handleClear}
      />

      <Tabs defaultValue="builder" className="w-full">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Switch workspace</p>
              <p className="text-xs text-muted-foreground">Focus on either form input or preview.</p>
            </div>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:min-w-[320px] bg-muted/40">
            <TabsTrigger value="builder" className="gap-2">
              Form
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              Preview
            </TabsTrigger>
          </TabsList>
          </div>
        </div>

        <TabsContent value="builder" className="mt-6">
          <FormBuilder 
            testScript={testScript} 
            updateTestScript={updateTestScript} 
            updateSection={updateSection} 
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <OutputSection testScript={testScript} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TestScriptBuilder
