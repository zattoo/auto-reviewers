import * as pullRequestReviewStates from './constants/pull-request-review-states';

/**
 * @see https://docs.github.com/en/graphql/reference/enums#pullrequestreviewstate
 */
export type PullRequestReviewState = typeof pullRequestReviewStates[keyof typeof pullRequestReviewStates];

export interface Node {
    id: number;
    node_id: string;
}

export interface User extends Node{
    login: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: "User",
    site_admin: boolean;
}

export interface PullRequestReview extends Node {
    user: User;
    body: string;
    state: PullRequestReviewState;
    html_url: string;
    pull_request_url: string;
    _links: {
        html: {
            href: string;
        };
    };
    pull_request: {
        href: string;
    };
    submitted_at: string;
    commit_id: string;
    author_association: string;
};
