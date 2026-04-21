export type EvaluationResult = {
  passed: boolean;
  issues: string[];
  instructions: string[];
};

export function evaluateCandidate(): EvaluationResult {
  return {
    passed: false,
    issues: [],
    instructions: []
  };
}
