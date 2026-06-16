"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus } from "lucide-react"
import type { TestScriptTeardown, TestScriptTeardownAction } from "@/types/fhir-enhanced"
import ActionComponent from "../shared/action-component"

interface TeardownSectionProps {
  teardown: TestScriptTeardown
  updateTeardown: (teardown: TestScriptTeardown) => void
  availableFixtures?: Array<{ id: string; description?: string }>
  availableProfiles?: Array<{ id: string; reference: string }>
}

export default function TeardownSection({ teardown, updateTeardown, availableFixtures = [], availableProfiles = [] }: TeardownSectionProps) {
  const actions = teardown.action ?? []

  const addTeardownAction = () => {
    const newAction: TestScriptTeardownAction = {
      operation: {
        encodeRequestUrl: true,
      },
    }
    updateTeardown({
      ...teardown,
      action: [...actions, newAction],
    })
  }

  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const teardownRef = useRef(teardown)
  teardownRef.current = teardown

  const updateTeardownRef = useRef(updateTeardown)
  updateTeardownRef.current = updateTeardown

  const updateActionStable = useCallback((index: number, action: TestScriptTeardownAction) => {
    const next = [...actionsRef.current]
    next[index] = action
    updateTeardownRef.current({
      ...teardownRef.current,
      action: next,
    })
  }, [])

  const removeActionStable = useCallback((index: number) => {
    const next = actionsRef.current.filter((_, idx) => idx !== index)
    updateTeardownRef.current({
      ...teardownRef.current,
      action: next,
    })
  }, [])

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={addTeardownAction} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Teardown Action
        </Button>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          title="No teardown actions defined yet."
          description="Add cleanup operations that run after test completion."
        />
      ) : (
        <div className="space-y-3">
          {actions.map((action, idx) => (
            <ActionComponent
              key={idx}
              action={action}
              index={idx}
              sectionType="teardown"
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
