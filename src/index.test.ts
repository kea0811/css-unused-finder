import { expect, test } from 'vitest';
import { ENGINE_NAME } from './index';

test('engine identifies itself', () => {
  expect(ENGINE_NAME).toBe('css-unused-finder');
});
