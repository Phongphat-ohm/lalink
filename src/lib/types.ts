/**
 * Canonical ActionResult type used across all Server Actions.
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
