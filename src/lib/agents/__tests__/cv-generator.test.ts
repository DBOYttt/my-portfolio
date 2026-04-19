import { describe, it, expect } from 'vitest'
import { formatMonth, sanitizeCvContent } from '../cv-generator'
import type { CvContent } from '../../cv-template'

describe('formatMonth', () => {
  it('returns empty string for null', () => {
    expect(formatMonth(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatMonth(undefined)).toBe('')
  })

  it('returns empty string for an invalid date string', () => {
    expect(formatMonth('not-a-date')).toBe('')
  })

  it('returns "January 2025" for a Date ISO string in January 2025', () => {
    expect(formatMonth(new Date('2025-01-15').toISOString())).toBe('January 2025')
  })

  it('returns "June 2024" for the string "2024-06-01"', () => {
    expect(formatMonth('2024-06-01')).toBe('June 2024')
  })
})

describe('sanitizeCvContent', () => {
  const baseCv: CvContent = {
    summary: '',
    skills: [],
    experience: [],
    projects: [],
    contact: { email: 'test@example.com' },
  }

  it('strips the word "passionate" from the summary', () => {
    const input: CvContent = { ...baseCv, summary: 'I am passionate about building great software.' }
    const result = sanitizeCvContent(input)
    expect(result.summary).not.toMatch(/passionate/i)
  })

  it('replaces "helped" with "contributed to"', () => {
    const input: CvContent = {
      ...baseCv,
      experience: [
        { company: 'ACME', role: 'Dev', period: 'Jan 2020 – Present', description: 'helped the team ship features', type: 'Full-time' },
      ],
    }
    const result = sanitizeCvContent(input)
    expect(result.experience[0].description).toContain('contributed to')
    expect(result.experience[0].description).not.toMatch(/\bhelped\b/i)
  })

  it('replaces "worked on" with "developed"', () => {
    const input: CvContent = {
      ...baseCv,
      experience: [
        { company: 'ACME', role: 'Dev', period: 'Jan 2020 – Present', description: 'worked on the backend API', type: 'Full-time' },
      ],
    }
    const result = sanitizeCvContent(input)
    expect(result.experience[0].description).toContain('developed')
    expect(result.experience[0].description).not.toMatch(/worked on/i)
  })

  it('returns an object with the same structure and does not mutate the original', () => {
    const original: CvContent = {
      ...baseCv,
      summary: 'passionate engineer',
      skills: [{ category: 'Languages', items: ['TypeScript'] }],
      projects: [{ title: 'MyApp', summary: 'A cool app', tech: ['React'] }],
    }
    const copy = { ...original, summary: original.summary }
    const result = sanitizeCvContent(original)

    // Original is not mutated
    expect(original.summary).toBe(copy.summary)
    // Result has the same top-level keys
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('skills')
    expect(result).toHaveProperty('experience')
    expect(result).toHaveProperty('projects')
    expect(result).toHaveProperty('contact')
    // Fluff is stripped in the result
    expect(result.summary).not.toMatch(/passionate/i)
  })
})
