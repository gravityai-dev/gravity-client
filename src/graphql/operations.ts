import { gql } from '@apollo/client';

// Core agent operations - used by all Gravity AI clients

// Talk to agent mutation (for messages/starting workflows)
// Use metadata: { workflowId, debugMode: true } for debug workflows
export const TALK_TO_AGENT = gql`
  mutation TalkToAgent($input: AgentInput!) {
    talkToAgent(input: $input) {
      chatId
      conversationId
      userId
      executionId
      providerId
      success
      message
    }
  }
`;

// Talk to agent with audio mutation (for speech-to-speech workflows)
export const TALK_TO_AGENT_WITH_AUDIO = gql`
  mutation TalkToAgentWithAudio($input: AudioAgentInput!) {
    talkToAgentWithAudio(input: $input) {
      chatId
      conversationId
      userId
      executionId
      providerId
      success
      message
    }
  }
`;

// Step workflow mutation (for debug control)
export const STEP_WORKFLOW = gql`
  mutation DebugNode($workflowId: ID!, $nodeId: String!, $executionId: ID!, $conversationId: String!) {
    debugNode(input: {
      workflowId: $workflowId
      nodeId: $nodeId  
      executionId: $executionId
      conversationId: $conversationId
    }) {
      success
      error
      executionId
    }
  }
`;

// Chat status query
export const GET_CHAT_STATUS = gql`
  query GetChatStatus($chatId: ID!) {
    getChatStatus(chatId: $chatId) {
      exists
      status
      startTime
      message
      error
    }
  }
`;

// Invoke node interaction mutation - uses node type directly (e.g., "DynamoDB")
export const INVOKE_NODE_INTERACTION = gql`
  mutation InvokeNodeInteraction($input: NodeInteractionInput!) {
    invokeNodeInteraction(input: $input) {
      success
      data
      error
      jobId
      progress
    }
  }
`;

// Flush workflow cache mutation
export const FLUSH_WORKFLOW_CACHE = gql`
  mutation FlushWorkflowCache($workflowId: ID) {
    flushWorkflowCache(workflowId: $workflowId)
  }
`;
