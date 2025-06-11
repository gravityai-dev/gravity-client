import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type ActionSuggestion = BaseEvent & {
  __typename?: 'ActionSuggestion';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type AgentEvent = ActionSuggestion | AudioChunk | ImageResponse | JsonData | MessageChunk | Metadata | ProgressUpdate | State | Text | ToolOutput;

export type AgentInput = {
  chatId: Scalars['ID']['input'];
  conversationId: Scalars['ID']['input'];
  message: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  providerId?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

export type AgentResponse = {
  __typename?: 'AgentResponse';
  chatId: Scalars['ID']['output'];
  conversationId: Scalars['ID']['output'];
  executionId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  providerId?: Maybe<Scalars['String']['output']>;
  responseStream: Array<AgentEvent>;
  success: Scalars['Boolean']['output'];
  userId: Scalars['ID']['output'];
};

export type AgentTypeInfo = {
  __typename?: 'AgentTypeInfo';
  examples?: Maybe<Scalars['JSON']['output']>;
  types: Array<Scalars['String']['output']>;
};

export type AudioChunk = BaseEvent & {
  __typename?: 'AudioChunk';
  audioData: Scalars['String']['output'];
  chatId: Scalars['ID']['output'];
  conversationId: Scalars['ID']['output'];
  duration?: Maybe<Scalars['Float']['output']>;
  format: Scalars['String']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  sourceType?: Maybe<Scalars['String']['output']>;
  textReference?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type BaseEvent = {
  chatId: Scalars['ID']['output'];
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type CancelResponse = {
  __typename?: 'CancelResponse';
  chatId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum ChatState {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Complete = 'COMPLETE',
  Error = 'ERROR',
  Idle = 'IDLE',
  Responding = 'RESPONDING',
  Thinking = 'THINKING',
  Waiting = 'WAITING'
}

export type ChatStatus = {
  __typename?: 'ChatStatus';
  error?: Maybe<Scalars['String']['output']>;
  exists: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type ComponentMetadata = {
  __typename?: 'ComponentMetadata';
  aiContext?: Maybe<Scalars['String']['output']>;
  confidence?: Maybe<Scalars['Float']['output']>;
  dataSource?: Maybe<Scalars['String']['output']>;
};

export type ComponentSpec = {
  __typename?: 'ComponentSpec';
  children?: Maybe<Array<ComponentSpecChild>>;
  metadata?: Maybe<ComponentMetadata>;
  props?: Maybe<Scalars['JSON']['output']>;
  type: Scalars['String']['output'];
};

export type ComponentSpecChild = ComponentSpec | TextContent;

export type Credential = {
  __typename?: 'Credential';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CredentialInput = {
  data: Scalars['JSON']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type DebugNodeInput = {
  input: Scalars['JSON']['input'];
  nodeConfig: Scalars['JSON']['input'];
  nodeType: Scalars['String']['input'];
};

export type DebugNodeResult = {
  __typename?: 'DebugNodeResult';
  error?: Maybe<Scalars['String']['output']>;
  executionTime?: Maybe<Scalars['Float']['output']>;
  logs?: Maybe<Array<Scalars['String']['output']>>;
  output?: Maybe<Scalars['JSON']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DeleteExecutionsResult = {
  __typename?: 'DeleteExecutionsResult';
  deletedCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type ImageResponse = BaseEvent & {
  __typename?: 'ImageResponse';
  alt?: Maybe<Scalars['String']['output']>;
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type JsonData = BaseEvent & {
  __typename?: 'JsonData';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  data: Scalars['JSON']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type McpCapabilities = {
  __typename?: 'McpCapabilities';
  logging: Scalars['Boolean']['output'];
  prompts: Scalars['Boolean']['output'];
  resources: Scalars['Boolean']['output'];
  tools: Scalars['Boolean']['output'];
};

export type McpPrompt = {
  __typename?: 'McpPrompt';
  arguments: Array<McpPromptArgument>;
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type McpPromptArgument = {
  __typename?: 'McpPromptArgument';
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
};

export type McpResource = {
  __typename?: 'McpResource';
  description?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  uri: Scalars['String']['output'];
};

export type McpServer = {
  __typename?: 'McpServer';
  capabilities: McpCapabilities;
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  prompts: Array<McpPrompt>;
  resources: Array<McpResource>;
  tools: Array<McpTool>;
  version: Scalars['String']['output'];
};

export type McpTool = {
  __typename?: 'McpTool';
  description?: Maybe<Scalars['String']['output']>;
  inputSchema: Scalars['JSON']['output'];
  name: Scalars['String']['output'];
};

export type McpToolsResponse = {
  __typename?: 'McpToolsResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  tools: Array<McpTool>;
};

export type MessageChunk = BaseEvent & {
  __typename?: 'MessageChunk';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  text: Scalars['String']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type Metadata = BaseEvent & {
  __typename?: 'Metadata';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  cancelAgentChat: CancelResponse;
  createCredential: Credential;
  debugNode: DebugNodeResult;
  deleteAllExecutions: DeleteExecutionsResult;
  deleteCredential: Scalars['Boolean']['output'];
  deleteWorkflow: Scalars['Boolean']['output'];
  executeWorkflow: WorkflowExecution;
  invokeNodeInteraction: NodeInteractionResult;
  resetQueueMetrics: Scalars['Boolean']['output'];
  saveWorkflow: Workflow;
  talkToAgent: AgentResponse;
  toggleWorkflowActive: Workflow;
  updateCredential: Credential;
};


export type MutationCancelAgentChatArgs = {
  chatId: Scalars['ID']['input'];
};


export type MutationCreateCredentialArgs = {
  input: CredentialInput;
};


export type MutationDebugNodeArgs = {
  input: DebugNodeInput;
};


export type MutationDeleteAllExecutionsArgs = {
  workflowId: Scalars['ID']['input'];
};


export type MutationDeleteCredentialArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExecuteWorkflowArgs = {
  id: Scalars['ID']['input'];
  input: Scalars['JSON']['input'];
};


export type MutationInvokeNodeInteractionArgs = {
  input: NodeInteractionInput;
};


export type MutationResetQueueMetricsArgs = {
  queueName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSaveWorkflowArgs = {
  input: WorkflowInput;
};


export type MutationTalkToAgentArgs = {
  input: AgentInput;
};


export type MutationToggleWorkflowActiveArgs = {
  active: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateCredentialArgs = {
  id: Scalars['ID']['input'];
  input: CredentialInput;
};

export type NodeCredential = {
  __typename?: 'NodeCredential';
  description?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
};

export type NodeExecution = {
  __typename?: 'NodeExecution';
  endTime?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  input?: Maybe<Scalars['JSON']['output']>;
  nodeId: Scalars['String']['output'];
  output?: Maybe<Scalars['JSON']['output']>;
  retryCount: Scalars['Int']['output'];
  startTime: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type NodeExecutionEvent = {
  __typename?: 'NodeExecutionEvent';
  error?: Maybe<Scalars['String']['output']>;
  executionId: Scalars['ID']['output'];
  input?: Maybe<Scalars['JSON']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  nodeId: Scalars['String']['output'];
  output?: Maybe<Scalars['JSON']['output']>;
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type NodeInteraction = {
  __typename?: 'NodeInteraction';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  returns?: Maybe<Scalars['JSON']['output']>;
  schema?: Maybe<Scalars['JSON']['output']>;
};

export type NodeInteractionInput = {
  executionId: Scalars['ID']['input'];
  interactionType: Scalars['String']['input'];
  nodeId: Scalars['String']['input'];
  payload: Scalars['JSON']['input'];
};

export type NodeInteractionResult = {
  __typename?: 'NodeInteractionResult';
  error?: Maybe<Scalars['String']['output']>;
  output?: Maybe<Scalars['JSON']['output']>;
  success: Scalars['Boolean']['output'];
};

export type NodePort = {
  __typename?: 'NodePort';
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type NodeServices = {
  __typename?: 'NodeServices';
  provides?: Maybe<Array<ServiceMethod>>;
  requires?: Maybe<Array<ServiceRequirement>>;
};

export type NodeTrace = {
  __typename?: 'NodeTrace';
  createdAt: Scalars['String']['output'];
  duration?: Maybe<Scalars['Float']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executionId: Scalars['ID']['output'];
  inputs?: Maybe<Scalars['JSON']['output']>;
  nodeId: Scalars['String']['output'];
  nodeType: Scalars['String']['output'];
  outputs?: Maybe<Scalars['JSON']['output']>;
  startTime: Scalars['String']['output'];
  status: Scalars['String']['output'];
  traceId: Scalars['ID']['output'];
};

export type NodeType = {
  __typename?: 'NodeType';
  category: Scalars['String']['output'];
  color: Scalars['String']['output'];
  configSchema?: Maybe<Scalars['JSON']['output']>;
  credentials?: Maybe<Array<NodeCredential>>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  inputs: Array<NodePort>;
  interactions: Array<NodeInteraction>;
  isService?: Maybe<Scalars['Boolean']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  outputs: Array<NodePort>;
  services?: Maybe<Scalars['JSON']['output']>;
  testData?: Maybe<Scalars['JSON']['output']>;
};

export type ProgressUpdate = BaseEvent & {
  __typename?: 'ProgressUpdate';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type ProviderStatus = {
  __typename?: 'ProviderStatus';
  available: Scalars['Boolean']['output'];
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  credential?: Maybe<Credential>;
  credentialTypes: Scalars['JSON']['output'];
  credentials: Array<Credential>;
  executionSummary: Scalars['JSON']['output'];
  executionTimeline: Scalars['JSON']['output'];
  getAgentTypes: AgentTypeInfo;
  getChatStatus: ChatStatus;
  health: SystemStatus;
  introspectAgentTypes?: Maybe<AgentTypeInfo>;
  mcpServer?: Maybe<McpServer>;
  mcpServers: Array<McpServer>;
  mcpStatus: ProviderStatus;
  mcpTools: McpToolsResponse;
  n8nStatus: ProviderStatus;
  nodePerformanceMetrics: Scalars['JSON']['output'];
  nodeTraces: Array<NodeTrace>;
  nodeTypes: Array<NodeType>;
  ping: Scalars['String']['output'];
  queueMetrics: Array<QueueMetrics>;
  registryDashboard: RegistryDashboard;
  systemPerformanceMetrics: Scalars['JSON']['output'];
  workflow?: Maybe<Workflow>;
  workflowExecution?: Maybe<WorkflowExecution>;
  workflowExecutions: WorkflowExecutionsResponse;
  workflowPerformanceOverview: Scalars['JSON']['output'];
  workflows: Array<Workflow>;
};


export type QueryCredentialArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecutionSummaryArgs = {
  executionId: Scalars['ID']['input'];
};


export type QueryExecutionTimelineArgs = {
  executionId: Scalars['ID']['input'];
};


export type QueryGetChatStatusArgs = {
  chatId: Scalars['ID']['input'];
};


export type QueryMcpServerArgs = {
  name: Scalars['String']['input'];
};


export type QueryNodePerformanceMetricsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nodeType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNodeTracesArgs = {
  executionId: Scalars['ID']['input'];
};


export type QueryWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkflowExecutionArgs = {
  executionId: Scalars['ID']['input'];
};


export type QueryWorkflowExecutionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  workflowId: Scalars['ID']['input'];
};


export type QueryWorkflowPerformanceOverviewArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  workflowId: Scalars['ID']['input'];
};

export type QueueMetrics = {
  __typename?: 'QueueMetrics';
  active: Scalars['Int']['output'];
  completed: Scalars['Int']['output'];
  delayed: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  paused: Scalars['Int']['output'];
  queueName: Scalars['String']['output'];
  waiting: Scalars['Int']['output'];
};

export type RegisteredNode = {
  __typename?: 'RegisteredNode';
  category: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  interactions: Array<RegistryInteraction>;
  name: Scalars['String']['output'];
  services?: Maybe<NodeServices>;
  type: Scalars['String']['output'];
};

export type RegistryDashboard = {
  __typename?: 'RegistryDashboard';
  interactions: Array<RegistryInteraction>;
  nodes: Array<RegisteredNode>;
  services: Array<RegistryService>;
  totalInteractions: Scalars['Int']['output'];
  totalServices: Scalars['Int']['output'];
};

export type RegistryInteraction = {
  __typename?: 'RegistryInteraction';
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  nodeType: Scalars['String']['output'];
  propertyName: Scalars['String']['output'];
};

export type RegistryService = {
  __typename?: 'RegistryService';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  methods: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type ServiceMethod = {
  __typename?: 'ServiceMethod';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ServiceRequirement = {
  __typename?: 'ServiceRequirement';
  methods: Array<Scalars['String']['output']>;
  serviceId: Scalars['String']['output'];
};

export type State = BaseEvent & {
  __typename?: 'State';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  variables?: Maybe<Scalars['JSON']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  aiResult: AgentEvent;
  systemStatus: SystemStatus;
  workflowExecution: NodeExecutionEvent;
};


export type SubscriptionAiResultArgs = {
  conversationId: Scalars['ID']['input'];
};


export type SubscriptionWorkflowExecutionArgs = {
  executionId: Scalars['ID']['input'];
};

export type SystemHealth = {
  __typename?: 'SystemHealth';
  services: Scalars['JSON']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type SystemStatus = {
  __typename?: 'SystemStatus';
  graphql: ProviderStatus;
  healthy: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  providers?: Maybe<Array<ProviderStatus>>;
  redis: ProviderStatus;
};

export type Text = BaseEvent & {
  __typename?: 'Text';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  text: Scalars['String']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type TextContent = {
  __typename?: 'TextContent';
  text: Scalars['String']['output'];
};

export type ToolOutput = BaseEvent & {
  __typename?: 'ToolOutput';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  result: Scalars['JSON']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
  tool: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type Workflow = {
  __typename?: 'Workflow';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  edges: Scalars['JSON']['output'];
  executions: WorkflowExecutionsResponse;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  nodes: Scalars['JSON']['output'];
  updatedAt: Scalars['String']['output'];
};


export type WorkflowExecutionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type WorkflowExecution = {
  __typename?: 'WorkflowExecution';
  endTime?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  input?: Maybe<Scalars['JSON']['output']>;
  nodeExecutions: Array<NodeExecution>;
  output?: Maybe<Scalars['JSON']['output']>;
  startTime: Scalars['String']['output'];
  status: Scalars['String']['output'];
  workflowId: Scalars['ID']['output'];
};

export type WorkflowExecutionsResponse = {
  __typename?: 'WorkflowExecutionsResponse';
  executions: Array<WorkflowExecution>;
  hasMore: Scalars['Boolean']['output'];
  total: Scalars['Int']['output'];
};

export type WorkflowInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  edges: Scalars['JSON']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  nodes: Scalars['JSON']['input'];
};

export type TalkToAgentMutationVariables = Exact<{
  input: AgentInput;
}>;


export type TalkToAgentMutation = { __typename?: 'Mutation', talkToAgent: { __typename?: 'AgentResponse', chatId: string, conversationId: string, userId: string, executionId?: string | null, providerId?: string | null, success: boolean, message?: string | null } };

export type GetChatStatusQueryVariables = Exact<{
  chatId: Scalars['ID']['input'];
}>;


export type GetChatStatusQuery = { __typename?: 'Query', getChatStatus: { __typename?: 'ChatStatus', exists: boolean, status?: string | null, startTime?: string | null, message?: string | null, error?: string | null } };


export const TalkToAgentDocument = gql`
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
export type TalkToAgentMutationFn = Apollo.MutationFunction<TalkToAgentMutation, TalkToAgentMutationVariables>;

/**
 * __useTalkToAgentMutation__
 *
 * To run a mutation, you first call `useTalkToAgentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTalkToAgentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [talkToAgentMutation, { data, loading, error }] = useTalkToAgentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTalkToAgentMutation(baseOptions?: Apollo.MutationHookOptions<TalkToAgentMutation, TalkToAgentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TalkToAgentMutation, TalkToAgentMutationVariables>(TalkToAgentDocument, options);
      }
export type TalkToAgentMutationHookResult = ReturnType<typeof useTalkToAgentMutation>;
export type TalkToAgentMutationResult = Apollo.MutationResult<TalkToAgentMutation>;
export type TalkToAgentMutationOptions = Apollo.BaseMutationOptions<TalkToAgentMutation, TalkToAgentMutationVariables>;
export const GetChatStatusDocument = gql`
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

/**
 * __useGetChatStatusQuery__
 *
 * To run a query within a React component, call `useGetChatStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChatStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChatStatusQuery({
 *   variables: {
 *      chatId: // value for 'chatId'
 *   },
 * });
 */
export function useGetChatStatusQuery(baseOptions: Apollo.QueryHookOptions<GetChatStatusQuery, GetChatStatusQueryVariables> & ({ variables: GetChatStatusQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetChatStatusQuery, GetChatStatusQueryVariables>(GetChatStatusDocument, options);
      }
export function useGetChatStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetChatStatusQuery, GetChatStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetChatStatusQuery, GetChatStatusQueryVariables>(GetChatStatusDocument, options);
        }
export function useGetChatStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetChatStatusQuery, GetChatStatusQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetChatStatusQuery, GetChatStatusQueryVariables>(GetChatStatusDocument, options);
        }
export type GetChatStatusQueryHookResult = ReturnType<typeof useGetChatStatusQuery>;
export type GetChatStatusLazyQueryHookResult = ReturnType<typeof useGetChatStatusLazyQuery>;
export type GetChatStatusSuspenseQueryHookResult = ReturnType<typeof useGetChatStatusSuspenseQuery>;
export type GetChatStatusQueryResult = Apollo.QueryResult<GetChatStatusQuery, GetChatStatusQueryVariables>;