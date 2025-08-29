// Authentication utility functions

import type { GitHubUserProfile, UserProfile } from './types';

/**
 * Calculate account age in days from GitHub created_at date
 */
export function calculateAccountAge(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Convert GitHub user profile to our UserProfile format
 */
export function convertGitHubProfileToUserProfile(
  githubProfile: GitHubUserProfile,
  userId: string
): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    githubId: githubProfile.id.toString(),
    githubUsername: githubProfile.login,
    accountAge: calculateAccountAge(githubProfile.created_at),
    followersCount: githubProfile.followers,
    repositoryCount: githubProfile.public_repos,
    isVerified: false, // Will be set after validation
    lastValidationAt: undefined,
  };
}

/**
 * Check if a user profile meets basic requirements
 */
export function meetsBasicRequirements(profile: UserProfile): boolean {
  return !!(
    profile.githubId &&
    profile.githubUsername &&
    profile.accountAge !== undefined &&
    profile.followersCount !== undefined &&
    profile.repositoryCount !== undefined
  );
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0] || '';
  return errors.join('. ');
}

/**
 * Format validation warnings for display
 */
export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  if (warnings.length === 1) return warnings[0] || '';
  return warnings.join('. ');
}
