/**
 * @jest-environment jsdom
 */

import { Shape, Mesh } from 'three';
import { TextEncoder } from 'node:util';
import {expect, test, beforeEach, describe} from '@jest/globals';
global.TextEncoder = TextEncoder;

import {apis} from '../src/apis.js';
global.apis = apis;

import { Building } from '../src/building.js';

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Step 1: get the full data for the buiding from the API
const initialData = `
`;

// Step 2: get the bounding box data for the buiding from the API
const mapData = `
`;

// Describe Issue
test('Diagnose Skillion Issue', async() => {
  fetch.mockResponses(
    [initialData],    // /way/1426868383/full
    [mapData],         // /map call
  );
  let wayId = '1426868383';
  const innerData = await Building.downloadDataAroundBuilding('way', wayId);
  const building = new Building(wayId, innerData);
  expect(building.id).toBe(wayId);
  const urlBase = 'https://api.openstreetmap.org/api/0.6/';
  expect(global.fetch.mock.calls[0][0]).toBe(urlBase + 'way/' + wayId + '/full');
  expect(global.fetch.mock.calls[1][0]).toBe(urlBase + 'map?bbox=125.7416897,39.0269534,125.7420811,39.0272423');
  // get building part
  const parts = building.parts;
  // let found = false;
  for (const part of parts){
    // Get the building part
    if (part.id === '1426868384'){
      const shape = part.shape;
      const points = shape.extractPoints().shape;
      //const options = {
      //  angle: (360 - part.options.roof.direction) / 360 * 2 * Math.PI,
      //  depth: part.options.roof.height,
      //  pitch: part.options.roof.angle / 180 * Math.PI,
      //};
      //expect(options).toBe({});
      expect(points).toBe([]);
      //expect(shape.toJSON()).toBe('');
      // found = true;
    }
  }
  // expect(found).toBeTrue();
  // dump outer shape
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
