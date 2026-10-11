/** Compile-time check: funding summaries must be accepted by intelligence evidence. */
import { summarizeFunding } from '../lib/dashboard-view.ts';
import type { FundingEvidence } from '../lib/intelligence.ts';

const validStatus: FundingEvidence['status'] = summarizeFunding(null).status;
void validStatus;
