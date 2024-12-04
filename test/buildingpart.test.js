import { BuildingPart } from '../src/buildingpart.js';

test('Test Cardinal to Degree', () => {
  expect(BuildingPart.cardinalToDegree('N')).toBe(0);
  expect(BuildingPart.cardinalToDegree('sSw')).toBe(202);
  expect(BuildingPart.cardinalToDegree('Wse')).toBeUndefined();
});
