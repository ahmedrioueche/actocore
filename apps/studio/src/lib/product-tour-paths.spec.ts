import { describe, expect, it } from 'vitest';

import {
  getProductTourNavigateTarget,
  isProductTourStepSatisfiedByPath,
  isProductTourStepVisibleOnPath,
} from '@/lib/product-tour-paths';

describe('product-tour-paths', () => {
  it('detects open_project completion when entering a project route', () => {
    expect(
      isProductTourStepSatisfiedByPath('open_project', '/projects/abc123'),
    ).toBe(true);
    expect(isProductTourStepSatisfiedByPath('open_project', '/projects')).toBe(
      false,
    );
  });

  it('shows open_project coachmark only on projects list', () => {
    expect(isProductTourStepVisibleOnPath('open_project', '/projects')).toBe(
      true,
    );
    expect(
      isProductTourStepVisibleOnPath('open_project', '/projects/abc'),
    ).toBe(false);
  });

  it('detects sidebar step routes', () => {
    expect(
      isProductTourStepSatisfiedByPath(
        'docs',
        '/projects/abc/docs/quick-start',
      ),
    ).toBe(true);
    expect(
      isProductTourStepSatisfiedByPath('api_keys', '/projects/abc/api-keys'),
    ).toBe(true);
  });

  it('builds navigate targets for project steps', () => {
    expect(getProductTourNavigateTarget('abc', 'docs')).toEqual({
      to: '/projects/$projectId/docs',
      params: { projectId: 'abc' },
    });
    expect(getProductTourNavigateTarget('abc', 'open_project')).toBeNull();
  });
});
