import { describe, expect, it } from 'vitest'
import { getAnimatedScale } from './organAnimation'

describe('organ animation', () => {
  it('eases a uniform organ into its blueprint scale', () => {
    expect(getAnimatedScale([2, 3, 4], 0, 0, 1, 'uniform')).toEqual([0, 0, 0])
    expect(getAnimatedScale([2, 3, 4], 1, 0, 1, 'uniform')).toEqual([2, 3, 4])
  })

  it('grows the configured axis faster while every axis emerges continuously from zero', () => {
    expect(getAnimatedScale([2, 3, 4], 0, 0, 1, 'y')).toEqual([0, 0, 0])
    expect(getAnimatedScale([2, 3, 4], 0.5, 0, 1, 'y')).toEqual([1.5, 2.625, 3])
  })
})
