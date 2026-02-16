'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createContractFromTemplateSchema } from '@/lib/validations/contract-section'
import { createContractFromTemplate } from '@/actions/contracts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type FormData = z.infer<typeof createContractFromTemplateSchema>

interface TemplateSection {
  id: string
  title: string
  body: string
  variables: string[]
}

interface VariableInputFormProps {
  templateId: string
  templateName: string
  sections: TemplateSection[]
  variables: string[]
}

export function VariableInputForm({
  templateId,
  templateName,
  sections,
  variables,
}: VariableInputFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(createContractFromTemplateSchema) as any,
    defaultValues: {
      templateId,
      title: '',
      description: '',
      variables: variables.reduce(
        (acc, variable) => {
          acc[variable] = ''
          return acc
        },
        {} as Record<string, string>
      ),
    },
  })

  // Watch variables to show preview
  const watchedVariables = form.watch('variables')

  // Replace variables in text for preview
  function replaceVariables(text: string): string {
    let result = text
    Object.entries(watchedVariables || {}).forEach(([key, value]) => {
      if (value) {
        const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        result = result.replace(pattern, String(value))
      }
    })
    return result
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    try {
      const contract = await createContractFromTemplate(data)
      toast({
        title: 'Success',
        description: 'Contract created successfully',
      })
      router.push(`/contracts/${contract.id}`)
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Provide basic information about this contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`${templateName} - Contract`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this contract..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {variables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fill Template Variables</CardTitle>
              <CardDescription>
                These values will be inserted into the contract sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.map((variable) => (
                <FormField
                  key={variable}
                  control={form.control}
                  name={`variables.${variable}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="capitalize">
                          {variable.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {'{{'} {variable} {'}}'}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                          {...field}
                          value={String(field.value || '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Preview Sections</CardTitle>
            <CardDescription>
              See how your contract will look with the provided values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {sections.map((section, index) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Section {index + 1}</Badge>
                      <span>{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border p-4">
                      {replaceVariables(section.body)}
                    </div>
                    {section.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">
                          Variables:
                        </span>
                        {section.variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="secondary"
                            className="text-xs"
                          >
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Contract'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
