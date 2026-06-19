import { describe, it, expect } from 'vitest';
import { runDoctorChecks } from '../src/cli/doctor.js';

describe('rc505mk2 doctor', () => {
  it('passes required checks in dev environment', () => {
    const checks = runDoctorChecks();
    const required = checks.filter(c => c.name !== 'RC-505mk2 device');

    for (const check of required) {
      expect(check.ok, `${check.name}: ${check.detail}`).toBe(true);
    }
  });

  it('reports device status without failing', () => {
    const checks = runDoctorChecks();
    const device = checks.find(c => c.name === 'RC-505mk2 device');
    expect(device).toBeDefined();
    expect(device!.ok).toBe(true);
  });
});
