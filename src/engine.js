'use strict';

const performanceMath = {
  speedup(oldTime, newTime) {
    return oldTime / newTime;
  },

  elapsed(user, system, waiting) {
    const cpu = user + system;
    return { cpu, elapsed: cpu + waiting };
  },

  clockPeriod(clockRate) {
    return 1 / clockRate;
  },

  clockCycles(instructionCount, cpi) {
    return instructionCount * cpi;
  },

  cpuTime(cycles, clockRate) {
    return cycles / clockRate;
  },

  instructionMix(rows) {
    const count = rows.reduce((sum, [amount]) => sum + amount, 0);
    const cycles = rows.reduce((sum, [amount, cpi]) => sum + performanceMath.clockCycles(amount, cpi), 0);
    return { count, cycles, cpi: cycles / count };
  },

  dynamicPowerRatio(loadRatio, voltageRatio, frequencyRatio) {
    return loadRatio * voltageRatio ** 2 * frequencyRatio;
  },

  improvedTime(affected, unaffected, partSpeedup) {
    return affected / partSpeedup + unaffected;
  },

  requiredSpeedup(affected, unaffected, targetTime) {
    if (targetTime <= unaffected) return targetTime === unaffected && affected === 0 ? 1 : Infinity;
    return affected / (targetTime - unaffected);
  },

  scaledCpuTime(oldTime, instructionRatio, cpiRatio) {
    return oldTime * instructionRatio * cpiRatio;
  },

  mips(clockRateHz, cpi) {
    return clockRateHz / (cpi * 1e6);
  },
};

if (typeof module !== 'undefined') module.exports = performanceMath;
