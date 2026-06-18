export { analyze } from './analyze';
export type { AnalyzeInput } from './analyze';
export { parseStylesheet } from './parser';
export { computeSpecificity, specificityScore, splitCompounds } from './specificity';
export {
  DEEP_NESTING_THRESHOLD,
  HIGH_SPECIFICITY_THRESHOLD,
  MAGIC_ZINDEX_THRESHOLD,
  gradeFor,
} from './fragility';
export {
  extractClassesFromMarkup,
  extractClassesFromSelector,
  extractDefinedClasses,
  findDeadClasses,
} from './deadClasses';
export type {
  AnalysisReport,
  Declaration,
  DeadClassReport,
  Finding,
  FindingKind,
  Grade,
  Rule,
  Severity,
  Specificity,
  Stats,
} from './types';
