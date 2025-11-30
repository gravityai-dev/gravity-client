import { useState, useEffect, useCallback } from "react";
import { useGraphQL } from "../../hooks/useGraphQL";

// GraphQL Queries - hidden from consumers
const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!, $workflowId: String!) {
    getUserProfile(userId: $userId, workflowId: $workflowId) {
      userId
      workflowId
      profile {
        name
        email
        phone
        firstName
        attributes
        tags
      }
      insights {
        currentState {
          stage
          situation
          challenges
          priorities
        }
        needs {
          immediate
          upcoming
          latent
        }
        needsTags
      }
      rawData
      metadata {
        version
        lastUpdated
        updateCount
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_MEMORIES = `
  query GetMemories($userId: String!, $workflowId: String, $limit: Int) {
    getMemories(userId: $userId, workflowId: $workflowId, limit: $limit) {
      userId
      workflowId
      memoryId
      content {
        summary
        importance
        tags
        keyFacts
        decisions
        actionItems
        sentiment
        topics
      }
      sourceConversationId
      sourceMessageCount
      timestamp
    }
  }
`;

// Types
export interface ProfileData {
  userId: string;
  workflowId: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    firstName: string;
    attributes: Record<string, any>;
    tags: string[];
  };
  insights: Record<string, any>;
  rawData: Record<string, any>;
  [key: string]: any;
}

export interface Memory {
  userId: string;
  workflowId: string;
  memoryId: string;
  content: {
    summary: string;
    importance: number;
    tags: string[];
    keyFacts: string[];
    decisions: string[];
    actionItems: string[];
    sentiment: string;
    topics: string[];
  };
  sourceConversationId: string;
  sourceMessageCount: number;
  timestamp: string;
}

export interface Insights {
  needs: {
    immediate: string[];
    upcoming: string[];
    latent: string[];
  };
  needsTags: string[];
  currentState: {
    stage?: string;
    situation?: string;
    challenges?: string[];
    priorities?: string[];
  };
}

export interface UseProfileDataOptions {
  apiUrl: string;
  getAccessToken?: () => Promise<string | null>;
}

export interface UseProfileDataReturn {
  profileData: ProfileData | null;
  memories: Memory[];
  insights: Insights | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch user profile and memories
 * GraphQL queries are encapsulated - consumers just get clean data
 */
export function useProfileData(
  userId: string,
  workflowId: string,
  options: UseProfileDataOptions
): UseProfileDataReturn {
  const { apiUrl, getAccessToken } = options;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);

  // Fetch profile
  const {
    data: profileQueryData,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGraphQL<{ getUserProfile: any }>(
    apiUrl,
    getAccessToken,
    GET_USER_PROFILE,
    { userId, workflowId },
    { skip: !userId || !workflowId }
  );

  // Fetch memories
  const {
    data: memoriesData,
    loading: memoriesLoading,
    error: memoriesError,
    refetch: refetchMemories,
  } = useGraphQL<{ getMemories: Memory[] }>(
    apiUrl,
    getAccessToken,
    GET_MEMORIES,
    { userId, workflowId, limit: 100 },
    { skip: !userId || !workflowId }
  );

  // Process profile data
  useEffect(() => {
    if (profileQueryData?.getUserProfile) {
      const profile = profileQueryData.getUserProfile;

      const transformedData: ProfileData = {
        userId: profile.userId,
        workflowId: profile.workflowId,
        profile: {
          name: profile.profile?.name || "",
          email: profile.profile?.email || "",
          phone: profile.profile?.phone || "",
          firstName: profile.profile?.firstName || "",
          attributes: profile.profile?.attributes || {},
          tags: profile.profile?.tags || [],
        },
        insights: profile.insights || {},
        rawData: profile.rawData || {},
        ...(profile.rawData || {}),
      };

      setProfileData(transformedData);

      if (profile.insights) {
        setInsights({
          needs: profile.insights.needs,
          needsTags: profile.insights.needsTags || [],
          currentState: profile.insights.currentState || {},
        });
      }
    }
  }, [profileQueryData]);

  // Process memories
  useEffect(() => {
    if (memoriesData?.getMemories) {
      setMemories(memoriesData.getMemories);
    }
  }, [memoriesData]);

  const loading = profileLoading || memoriesLoading;
  const error = profileError || memoriesError;

  const refetch = useCallback(() => {
    refetchProfile();
    refetchMemories();
  }, [refetchProfile, refetchMemories]);

  return {
    profileData,
    memories,
    insights,
    loading,
    error,
    refetch,
  };
}

export default useProfileData;
