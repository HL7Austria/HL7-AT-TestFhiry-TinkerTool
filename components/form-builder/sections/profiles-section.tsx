"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { TestScriptProfile } from "@/types/fhir-enhanced"

interface ProfilesSectionProps {
  profiles: TestScriptProfile[] | undefined
  updateProfiles: (profiles: TestScriptProfile[] | undefined) => void
  updateTestScript?: (newData: Partial<{ profile: any; _profile: any }>) => void
}

/**
 * Konvertiert konsolidierte Profile in aufgeteiltes FHIR-Format
 * profile: Array von Strings (Referenzen)
 * _profile: Array von Objekten mit id
 */
function convertToSplitFormat(consolidatedProfiles: TestScriptProfile[]): { profile: string[], _profile: { id: string }[] } {
  const profileUrls: string[] = []
  const profileExtensions: { id: string }[] = []

  consolidatedProfiles.forEach((profile) => {
    if (profile.reference) {
      profileUrls.push(profile.reference)
      profileExtensions.push({ id: profile.id })
    }
  })

  return { profile: profileUrls, _profile: profileExtensions }
}

/**
 * Liest Profile aus aufgeteiltem oder konsolidiertem Format
 */
function readProfiles(profiles: any): TestScriptProfile[] {
  // Wenn profile und _profile beide existieren, ist es das aufgeteilte Format
  if (profiles?.profile && profiles?._profile) {
    const profileUrls = profiles.profile as string[]
    const profileExtensions = profiles._profile as { id: string }[]

    return profileUrls.map((url, idx) => ({
      id: profileExtensions[idx]?.id || `profile-${idx}`,
      reference: url,
    }))
  }

  // Andernfalls ist es das konsolidierte Format
  return profiles ?? []
}

export function ProfilesSection({ profiles, updateProfiles, updateTestScript }: ProfilesSectionProps) {
  const entries = useMemo(() => readProfiles(profiles), [profiles])
  const [newProfileId, setNewProfileId] = useState("")
  const [newProfileRef, setNewProfileRef] = useState("")
  const [validationError, setValidationError] = useState("")

  const addProfile = () => {
    const id = newProfileId.trim()
    const reference = newProfileRef.trim()
    
    if (!id || !reference) {
      setValidationError("Beide Felder (ID und Reference) müssen ausgefüllt werden.")
      return
    }
    
    setValidationError("")
    
    // Konvertiere zu aufgeteiltem Format
    const consolidated = [...entries, { id, reference }]
    const splitFormat = convertToSplitFormat(consolidated)
    
    // Sende beide Felder als separate Updates
    updateProfiles(splitFormat.profile as any)
    // _profile muss separat gesetzt werden - hier nutzen wir einen Workaround
    // indem wir das gesamte TestScript-Objekt manipulieren
    const testScript = (window as any).__currentTestScript
    if (testScript) {
      testScript._profile = splitFormat._profile
    }
    
    setNewProfileId("")
    setNewProfileRef("")
  }

  const updateProfile = (idx: number, field: keyof TestScriptProfile, value: string) => {
    const next = [...entries]
    next[idx] = { ...next[idx], [field]: value }
    
    // Konvertiere zu aufgeteiltem Format
    const splitFormat = convertToSplitFormat(next)
    
    if (updateTestScript) {
      updateTestScript({ profile: splitFormat.profile, _profile: splitFormat._profile })
    } else {
      updateProfiles(splitFormat.profile as any)
    }
  }

  const handleInputChange = (setter: (value: string) => void, value: string) => {
    setValidationError("")
    setter(value)
  }

  const removeProfile = (idx: number) => {
    const next = entries.filter((_, index) => index !== idx)
    
    if (next.length > 0) {
      const splitFormat = convertToSplitFormat(next)
      if (updateTestScript) {
        updateTestScript({ profile: splitFormat.profile, _profile: splitFormat._profile })
      } else {
        updateProfiles(splitFormat.profile as any)
      }
    } else {
      if (updateTestScript) {
        updateTestScript({ profile: undefined, _profile: undefined })
      } else {
        updateProfiles(undefined)
      }
    }
  }

  return (
    <div className="space-y-4 p-2">
      <div>
        <h4 className="text-sm font-medium">Profiles</h4>
        <p className="text-xs text-muted-foreground">
          Liste von Profilen (StructureDefinitions), die dieses TestScript abdeckt.
          Jedes Profil benötigt eine eindeutige ID und eine kanonische Reference URL.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <h5 className="text-sm font-medium">Neues Profil hinzufügen</h5>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="new-profile-id">ID (z.B. &quot;patient-profile&quot;)</Label>
            <Input
              id="new-profile-id"
              value={newProfileId}
              onChange={(event) => handleInputChange(setNewProfileId, event.target.value)}
              placeholder="patient-profile"
              className={validationError ? "border-destructive" : ""}
            />
          </div>
          <div>
            <Label htmlFor="new-profile-ref">Reference (kanonische URL)</Label>
            <Input
              id="new-profile-ref"
              value={newProfileRef}
              onChange={(event) => handleInputChange(setNewProfileRef, event.target.value)}
              placeholder="http://hl7.at/fhir/HL7ATCoreProfiles/4.0.1/StructureDefinition/at-core-patient"
              className={validationError ? "border-destructive" : ""}
            />
          </div>
        </div>
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
        <Button variant="outline" onClick={addProfile} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Profil hinzufügen
        </Button>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          title="Keine Profile definiert."
          description="Fügen Sie Profile hinzu, die in Assertions referenziert werden können."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((profile, idx) => (
            <Card key={`${profile.id}-${idx}`} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`profile-id-${idx}`}>ID</Label>
                    <Input
                      id={`profile-id-${idx}`}
                      value={profile.id}
                      onChange={(event) => updateProfile(idx, "id", event.target.value)}
                      placeholder="Eindeutige ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`profile-ref-${idx}`}>Reference</Label>
                    <Input
                      id={`profile-ref-${idx}`}
                      value={profile.reference}
                      onChange={(event) => updateProfile(idx, "reference", event.target.value)}
                      placeholder="Kanonische URL"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeProfile(idx)}
                  title="Profil entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


