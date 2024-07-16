import { BuildingPart } from '../src/buildingpart.js';

test('Test Cardinal to Degree', () => {
  expect(BuildingPart.cardinalToDegree('N')).toBe(1);
});
