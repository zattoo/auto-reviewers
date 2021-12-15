import * as GitHub from './typings/github';

export type LatestUserReviewMap = Record<string, GitHub.Review>;


/**
 * Mapping file to its owners
 *
 * @example {'projects/app/src/index.js': ['z-bot-1', 'zattoo-bot-0']}
 */
export type OwnersMap = Record<string, string[]>;

export {
    GitHub,
}


export as namespace $Reviewers;
