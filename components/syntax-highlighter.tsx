"use client"

import { cn } from "@/lib/utils"
import { Highlight, themes } from "prism-react-renderer"
import { useTheme } from "next-themes"

interface ValidationError {
  line: number
  column?: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface SyntaxHighlighterProps {
  language: string
  code: string
  showLineNumbers?: boolean
  className?: string
  searchTerm?: string
  validationErrors?: ValidationError[]
}

/**
 * Syntax-Highlighter mit prism-react-renderer
 * Verwendet echte Tokenisierung für korrekte Farbgebung
 */
export function SyntaxHighlighter({
  language,
  code,
  showLineNumbers = true,
  className,
  searchTerm,
  validationErrors = [],
}: SyntaxHighlighterProps) {
  // prism-react-renderer uses "markup" for XML/HTML
  const prismLanguage = language === 'xml' ? 'markup' : language

  // Theme based on current light/dark mode
  const { resolvedTheme } = useTheme()
  const highlightTheme = resolvedTheme === 'dark' ? themes.vsDark : themes.vsLight
  //dark --> dracula, duotoneDark, synthwave84, oceanicNext, palenight, shadesOfPurple
  //light --> vsLight; duotoneLigt, nightOwlLight

  // Create error map for fast access
  const errorMap = new Map<number, ValidationError[]>()
  validationErrors.forEach(error => {
    const lineErrors = errorMap.get(error.line) || []
    lineErrors.push(error)
    errorMap.set(error.line, lineErrors)
  })

  return (
    <div className={cn("relative", className)}>
      <Highlight theme={highlightTheme} code={code} language={prismLanguage}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-4 bg-card border rounded-md shadow-sm">
            <code className={`language-${language}`}>
              <div className="flex">
                {showLineNumbers && (
                  <div className="mr-4 select-none text-muted-foreground text-sm font-mono border-r border-border pr-4">
                    {tokens.map((_, index) => {
                      const num = index + 1
                      const hasError = errorMap.has(num)
                      const errors = errorMap.get(num) || []
                      const hasErrorSeverity = errors.some(e => e.severity === 'error')
                      const hasWarningSeverity = errors.some(e => e.severity === 'warning')
                      
                      return (
                        <div 
                          key={num} 
                          className={cn(
                            "leading-6 px-1 rounded",
                            hasErrorSeverity && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                            hasWarningSeverity && !hasErrorSeverity && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          )}
                          title={hasError ? errors.map(e => e.message).join('\n') : undefined}
                        >
                          {num}
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="flex-1 font-mono text-sm">
                  {tokens.map((line, index) => {
                    const lineNum = index + 1
                    const hasError = errorMap.has(lineNum)
                    const errors = errorMap.get(lineNum) || []
                    const hasErrorSeverity = errors.some(e => e.severity === 'error')
                    const hasWarningSeverity = errors.some(e => e.severity === 'warning')
                    const lineProps = getLineProps({ line })

                    return (
                      <div key={index} className="group relative">
                        <div 
                          {...lineProps}
                          className={cn(
                            "leading-6 px-2 -mx-2 rounded",
                            hasErrorSeverity && "bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500",
                            hasWarningSeverity && !hasErrorSeverity && "bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-500"
                          )}
                          style={{}}
                        >
                          {line.map((token, key) => {
                            const tokenProps = getTokenProps({ token })
                            
                            // Search term highlighting within tokens
                            if (searchTerm && tokenProps.children) {
                              const text = String(tokenProps.children)
                              const highlighted = highlightSearchInText(text, searchTerm)
                              if (highlighted) {
                                return (
                                  <span
                                    key={key}
                                    className={tokenProps.className}
                                    dangerouslySetInnerHTML={{ __html: highlighted }}
                                  />
                                )
                              }
                            }
                            
                            return <span key={key} {...tokenProps} />
                          })}
                          {line.length === 1 && line[0].content === '\n' && '\u00A0'}
                        </div>
                        
                        {/* Error Tooltip */}
                        {hasError && (
                          <div className="absolute left-full top-0 ml-2 z-10 hidden group-hover:block">
                            <div className="bg-popover border border-border rounded-md shadow-lg p-3 max-w-md">
                              {errors.map((error, idx) => (
                                <div key={idx} className={cn(
                                  "text-xs mb-1 last:mb-0",
                                  error.severity === 'error' && "text-red-600 dark:text-red-400",
                                  error.severity === 'warning' && "text-yellow-600 dark:text-yellow-400",
                                  error.severity === 'info' && "text-blue-600 dark:text-blue-400"
                                )}>
                                  <strong>{error.severity.toUpperCase()}:</strong> {error.message}
                                  {error.column && ` (Spalte ${error.column})`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}

export default SyntaxHighlighter

/**
 * Hebt Suchbegriffe im Code hervor
 */
function highlightSearchInText(text: string, searchTerm: string): string | null {
  if (!searchTerm) return null;
  
  try {
    const regex = new RegExp(searchTerm, 'gi')
    if (!regex.test(text)) return null;
    
    return text.replace(
      new RegExp(searchTerm, 'gi'), 
      match => `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">${match}</mark>`
    );
  } catch (error) {
    // Error handling for invalid RegEx
    console.warn("Invalid search expression:", error);
    return null;
  }
}