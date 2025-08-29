// GitHub account validation utilities

import type { GitHubUserProfile, AuthValidationResult, GitHubValidationCriteria } from './types';

export class GitHubAccountValidator {
  private criteria: GitHubValidationCriteria;

  constructor(criteria: Partial<GitHubValidationCriteria> = {}) {
    this.criteria = {
      minAccountAgeDays: 30,
      minFollowersCount: 5,
      minRepositoryCount: 1,
      ...criteria,
    };
  }

  /**
   * Validate a GitHub user profile against the faucet requirements
   */
  validateProfile(profile: GitHubUserProfile): AuthValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check account age
    const accountAge = this.calculateAccountAge(profile.created_at);
    if (accountAge < this.criteria.minAccountAgeDays) {
      errors.push(
        `Account must be at least ${this.criteria.minAccountAgeDays} days old. Current age: ${accountAge} days`
      );
    }

    // Check followers count
    if (profile.followers < this.criteria.minFollowersCount) {
      errors.push(
        `Account must have at least ${this.criteria.minFollowersCount} followers. Current followers: ${profile.followers}`
      );
    }

    // Check repository count
    if (profile.public_repos < this.criteria.minRepositoryCount) {
      errors.push(
        `Account must have at least ${this.criteria.minRepositoryCount} public repository. Current repositories: ${profile.public_repos}`
      );
    }

    // Check if email is verified (GitHub OAuth provides verified emails)
    if (!profile.email) {
      errors.push('GitHub account must have a verified email address');
    }

    // Add warnings for accounts that barely meet requirements
    if (accountAge <= this.criteria.minAccountAgeDays + 7) {
      warnings.push('Account is very new, consider waiting before making claims');
    }

    if (profile.followers <= this.criteria.minFollowersCount + 2) {
      warnings.push('Account has very few followers, consider building your presence');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate account age in days
   */
  private calculateAccountAge(createdAt: string): number {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get validation criteria
   */
  getCriteria(): GitHubValidationCriteria {
    return { ...this.criteria };
  }
}

/**
 * Create a default validator instance
 */
export const createDefaultValidator = () => new GitHubAccountValidator();
