import { describe,it,expect } from 'vitest'
import { allocateSchedule } from '../src/services/scheduling/allocateSchedule.js'
describe('edge cases',()=>{it('handles one day',()=>expect(allocateSchedule(1,[],[]).days).toHaveLength(1));it('handles a 60-day request',()=>expect(allocateSchedule(60,[],[]).days).toHaveLength(60))})
