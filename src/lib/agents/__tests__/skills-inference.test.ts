import { describe, it, expect } from 'vitest'
import { normaliseCategoryEnum } from '../skills-inference'

describe('normaliseCategoryEnum', () => {
  it('maps LANGUAGE to LANGUAGE', () => {
    expect(normaliseCategoryEnum('LANGUAGE')).toBe('LANGUAGE')
  })

  it('maps FRAMEWORK to FRAMEWORK', () => {
    expect(normaliseCategoryEnum('FRAMEWORK')).toBe('FRAMEWORK')
  })

  it('maps DATABASE to DATABASE', () => {
    expect(normaliseCategoryEnum('DATABASE')).toBe('DATABASE')
  })

  it('maps TOOL to TOOL', () => {
    expect(normaliseCategoryEnum('TOOL')).toBe('TOOL')
  })

  it('maps ROBOTICS to OTHER', () => {
    expect(normaliseCategoryEnum('ROBOTICS')).toBe('OTHER')
  })

  it('maps EMBEDDED to OTHER', () => {
    expect(normaliseCategoryEnum('EMBEDDED')).toBe('OTHER')
  })

  it('maps OTHER to OTHER', () => {
    expect(normaliseCategoryEnum('OTHER')).toBe('OTHER')
  })

  it('maps unknown value "RANDOM" to OTHER as fallback', () => {
    expect(normaliseCategoryEnum('RANDOM')).toBe('OTHER')
  })
})
