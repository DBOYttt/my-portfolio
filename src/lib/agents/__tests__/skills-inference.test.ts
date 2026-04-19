import { describe, it, expect } from 'vitest'
import { normaliseCategoryEnum } from '../skills-inference'

describe('normaliseCategoryEnum', () => {
  it('maps LANGUAGE to LANGUAGES', () => {
    expect(normaliseCategoryEnum('LANGUAGE')).toBe('LANGUAGES')
  })

  it('maps FRAMEWORK to FRAMEWORKS', () => {
    expect(normaliseCategoryEnum('FRAMEWORK')).toBe('FRAMEWORKS')
  })

  it('maps DATABASE to DATABASES', () => {
    expect(normaliseCategoryEnum('DATABASE')).toBe('DATABASES')
  })

  it('maps TOOL to TOOLS', () => {
    expect(normaliseCategoryEnum('TOOL')).toBe('TOOLS')
  })

  it('maps ROBOTICS to CONCEPTS', () => {
    expect(normaliseCategoryEnum('ROBOTICS')).toBe('CONCEPTS')
  })

  it('maps EMBEDDED to CONCEPTS', () => {
    expect(normaliseCategoryEnum('EMBEDDED')).toBe('CONCEPTS')
  })

  it('maps OTHER to TOOLS', () => {
    expect(normaliseCategoryEnum('OTHER')).toBe('TOOLS')
  })

  it('maps unknown value "RANDOM" to TOOLS as fallback', () => {
    expect(normaliseCategoryEnum('RANDOM')).toBe('TOOLS')
  })
})
