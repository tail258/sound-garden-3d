import { genotypeSchema, type GenotypeV1 } from '../genotype/schema'
import { createSeededRandom } from '../random/seededRandom'
import { assertValidBlueprint } from './validateBlueprint'
import { generateColony, type ColonyGenotype } from './generators/colony'
import { generateRosette, type RosetteGenotype } from './generators/rosette'
import { generateTree, type TreeGenotype } from './generators/tree'
import type { PlantBlueprintV1 } from './types'

export function generatePlant(input: GenotypeV1): PlantBlueprintV1 {
  const genotype = genotypeSchema.parse(input)
  const random = createSeededRandom(genotype.seed)
  const blueprint =
    genotype.morphology.family === 'tree'
      ? generateTree(genotype as TreeGenotype, random)
      : genotype.morphology.family === 'rosette'
        ? generateRosette(genotype as RosetteGenotype, random)
        : generateColony(genotype as ColonyGenotype, random)

  assertValidBlueprint(blueprint)
  return blueprint
}
