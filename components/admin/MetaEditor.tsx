'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { IconPicker } from '@/components/ui/IconPicker'
import { updateQuizMeta } from '@/app/actions/quiz-actions'
import { THEME_PRESETS } from '@/lib/theme'

interface MetaEditorProps {
  quiz: {
    id: string
    title: string
    description: string | null
    theme: any
    icon?: string | null
    gradient?: string | null
  }
}

export function MetaEditor({ quiz }: MetaEditorProps) {
  const [title, setTitle] = useState(quiz.title)
  const [description, setDescription] = useState(quiz.description || '')
  const [icon, setIcon] = useState(quiz.icon || 'Brain')
  const [gradient, setGradient] = useState(quiz.gradient || 'from-purple-500 to-pink-500')
  const [selectedTheme, setSelectedTheme] = useState(
    typeof quiz.theme === 'object' && quiz.theme?.presetId
      ? quiz.theme.presetId
      : THEME_PRESETS[0].id
  )

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    if (newTitle.trim()) {
      try {
        await updateQuizMeta(quiz.id, {
          title: newTitle,
          description,
          theme: { presetId: selectedTheme },
        })
      } catch (error) {
        console.error('Failed to save title:', error)
      }
    }
  }

  const handleDescriptionChange = async (newDescription: string) => {
    setDescription(newDescription)
    try {
      await updateQuizMeta(quiz.id, {
        title,
        description: newDescription,
        theme: { presetId: selectedTheme },
      })
    } catch (error) {
      console.error('Failed to save description:', error)
    }
  }

  const handleThemeChange = async (themeId: string) => {
    setSelectedTheme(themeId)
    // Auto-save theme
    try {
      await updateQuizMeta(quiz.id, {
        title,
        description,
        theme: { presetId: themeId },
        icon,
        gradient,
      })
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  const handleIconChange = async (newIcon: string, newGradient: string) => {
    setIcon(newIcon)
    setGradient(newGradient)
    try {
      await updateQuizMeta(quiz.id, {
        title,
        description,
        theme: { presetId: selectedTheme },
        icon: newIcon,
        gradient: newGradient,
      })
    } catch (error) {
      console.error('Failed to save icon:', error)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quiz Details</h2>
        
        <Input
          label="Title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter quiz title..."
        />
        
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Enter quiz description..."
          rows={3}
        />
        
        <IconPicker 
          value={icon}
          gradient={gradient}
          onChange={handleIconChange}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEME_PRESETS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                className={`relative p-4 rounded-lg border-2 transition ${
                  selectedTheme === theme.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="w-full h-20 rounded mb-2" 
                  style={theme.previewStyle}
                />
                <p className="text-sm font-medium text-center text-gray-900">{theme.name}</p>
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
