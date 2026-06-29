"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus } from "lucide-react"
import type { TestScriptSetup, TestScriptSetupAction } from "@/types/fhir-enhanced"
import { useFhirVersion } from "@/lib/fhir-version-context"
import ActionComponent from "../shared/action-component"

interface SetupSectionProps {
  setup: TestScriptSetup
  updateSetup: (setup: TestScriptSetup) => void
  availableFixtures?: Array<{ id: string; description?: string }>
  availableProfiles?: Array<{ id: string; reference: string }>
}

export default function SetupSection({ setup, updateSetup, availableFixtures = [], availableProfiles = [] }: SetupSectionProps) {
  const actions = setup.action ?? []
  const { currentVersion } = useFhirVersion()

  const addSetupAction = () => {
    const newAction: TestScriptSetupAction = {
      operation: {
        encodeRequestUrl: true,
      },
    }
    updateSetup({
      ...setup,
      action: [...actions, newAction],
    })
  }

  const addSetupAssertionAction = () => {
    const newAction: TestScriptSetupAction = {
      assert: {
        response: "okay",
        warningOnly: false,
        stopTestOnFail: currentVersion === "R5",
      },
    }
    updateSetup({
      ...setup,
      action: [...actions, newAction],
    })
  }

  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const setupRef = useRef(setup)
  setupRef.current = setup

  const updateSetupRef = useRef(updateSetup)
  updateSetupRef.current = updateSetup

  const updateActionStable = useCallback((index: number, action: TestScriptSetupAction) => {
    const next = [...actionsRef.current]
    next[index] = action
    updateSetupRef.current({
      ...setupRef.current,
      action: next,
    })
  }, [])

  const removeActionStable = useCallback((index: number) => {
    const next = actionsRef.current.filter((_, idx) => idx !== index)
    updateSetupRef.current({
      ...setupRef.current,
      action: next,
    })
  }, [])

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={addSetupAction} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Operation
        </Button>
        <Button variant="outline" size="sm" onClick={addSetupAssertionAction} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Assertion
        </Button>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          title="No setup actions defined yet."
          description="Add preparatory operations that run before the actual tests."
        />
      ) : (
        <div className="space-y-3">
          {actions.map((action, idx) => (
            <ActionComponent
              key={idx}
              action={action}
              index={idx}
              sectionType="setup"
              updateAction={updateActionStable}
              removeAction={removeActionStable}
              availableFixtures={availableFixtures}
              availableProfiles={availableProfiles}
            />
          ))}
        </div>
      )}
    </div>
  )
}