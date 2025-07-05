export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
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

export type AgentEvent = ActionSuggestion | AudioChunk | Cards | JsonData | MessageChunk | NodeExecutionEvent | ProgressUpdate | Questions | State | Text;

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

export type CacheMetadata = {
  __typename?: 'CacheMetadata';
  cacheAge?: Maybe<Scalars['Int']['output']>;
  cacheHit: Scalars['Boolean']['output'];
  cached: Scalars['Boolean']['output'];
  executionMode?: Maybe<Scalars['String']['output']>;
  optimizationLevel?: Maybe<Scalars['String']['output']>;
};

export type CancelResponse = {
  __typename?: 'CancelResponse';
  chatId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Cards = BaseEvent & {
  __typename?: 'Cards';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export enum ChatState {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
  RESPONDING = 'RESPONDING',
  THINKING = 'THINKING',
  WAITING = 'WAITING'
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
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CredentialInput = {
  data: Scalars['JSON']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CredentialProperty = {
  __typename?: 'CredentialProperty';
  default?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  placeholder?: Maybe<Scalars['String']['output']>;
  required: Scalars['Boolean']['output'];
  secret: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
};

export type CredentialType = {
  __typename?: 'CredentialType';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  properties: Array<CredentialProperty>;
};

export type CredentialWithData = {
  __typename?: 'CredentialWithData';
  createdAt: Scalars['String']['output'];
  data: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export enum DebugMode {
  FULL_WORKFLOW = 'FULL_WORKFLOW',
  PLAY_TO_NODE = 'PLAY_TO_NODE',
  RESET = 'RESET',
  SINGLE_NODE = 'SINGLE_NODE'
}

export type DebugNodeInput = {
  clearState?: InputMaybe<Scalars['Boolean']['input']>;
  config?: InputMaybe<Scalars['JSON']['input']>;
  context?: InputMaybe<Scalars['JSON']['input']>;
  conversationId?: InputMaybe<Scalars['String']['input']>;
  executionId?: InputMaybe<Scalars['ID']['input']>;
  mode?: InputMaybe<DebugMode>;
  nodeId?: InputMaybe<Scalars['String']['input']>;
  nodeInputs?: InputMaybe<Scalars['JSON']['input']>;
  nodeType?: InputMaybe<Scalars['String']['input']>;
  serviceProviders?: InputMaybe<Scalars['JSON']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};

export type DebugNodeResult = {
  __typename?: 'DebugNodeResult';
  duration?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executionId?: Maybe<Scalars['String']['output']>;
  nextNodes?: Maybe<Array<Scalars['String']['output']>>;
  output?: Maybe<Scalars['JSON']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  targetNode?: Maybe<Scalars['String']['output']>;
  workflow?: Maybe<WorkflowContext>;
};

export type DeleteExecutionsResult = {
  __typename?: 'DeleteExecutionsResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum ExecutionMode {
  DEBUG = 'DEBUG',
  PRODUCTION = 'PRODUCTION'
}

export type ExecutionSummary = {
  __typename?: 'ExecutionSummary';
  averageNodeDuration?: Maybe<Scalars['Float']['output']>;
  completedAt?: Maybe<Scalars['String']['output']>;
  completedNodes: Scalars['Int']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  executionId: Scalars['ID']['output'];
  failedNodes: Scalars['Int']['output'];
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  totalNodes: Scalars['Int']['output'];
  workflowId: Scalars['ID']['output'];
  workflowName?: Maybe<Scalars['String']['output']>;
};

export type ExecutionTimelineItem = {
  __typename?: 'ExecutionTimelineItem';
  duration?: Maybe<Scalars['Float']['output']>;
  endTime?: Maybe<Scalars['Float']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  inputs?: Maybe<Scalars['JSON']['output']>;
  nodeId: Scalars['ID']['output'];
  nodeName?: Maybe<Scalars['String']['output']>;
  nodeType: Scalars['String']['output'];
  outputs?: Maybe<Scalars['JSON']['output']>;
  relativeEnd?: Maybe<Scalars['Float']['output']>;
  relativeStart: Scalars['Float']['output'];
  startTime: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type HealthStatus = {
  __typename?: 'HealthStatus';
  healthy: Scalars['Boolean']['output'];
  warnings: Array<Scalars['String']['output']>;
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
  index?: Maybe<Scalars['Int']['output']>;
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
  mode?: InputMaybe<ExecutionMode>;
  pauseAfterNode?: InputMaybe<Scalars['ID']['input']>;
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

export type NodeExecutionEvent = BaseEvent & {
  __typename?: 'NodeExecutionEvent';
  chatId: Scalars['ID']['output'];
  conversationId: Scalars['ID']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executionId: Scalars['ID']['output'];
  nodeId: Scalars['ID']['output'];
  nodeType: Scalars['String']['output'];
  outputs?: Maybe<Scalars['JSON']['output']>;
  providerId?: Maybe<Scalars['String']['output']>;
  state: NodeExecutionState;
  timestamp?: Maybe<Scalars['String']['output']>;
  triggeredSignals?: Maybe<Array<TriggeredSignal>>;
  userId: Scalars['ID']['output'];
  workflowId: Scalars['ID']['output'];
};

export enum NodeExecutionState {
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  STARTED = 'STARTED'
}

export type NodeInteraction = {
  __typename?: 'NodeInteraction';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  returns?: Maybe<Scalars['JSON']['output']>;
  schema?: Maybe<Scalars['JSON']['output']>;
};

export type NodeInteractionInput = {
  interactionId: Scalars['String']['input'];
  nodeId: Scalars['String']['input'];
  params?: InputMaybe<Scalars['JSON']['input']>;
};

export type NodeInteractionResult = {
  __typename?: 'NodeInteractionResult';
  data?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  jobId?: Maybe<Scalars['String']['output']>;
  progress?: Maybe<Scalars['Float']['output']>;
  success: Scalars['Boolean']['output'];
};

export type NodePerformance = {
  __typename?: 'NodePerformance';
  averageDuration: Scalars['Float']['output'];
  executionCount: Scalars['Int']['output'];
  lastExecuted: Scalars['String']['output'];
  maxDuration: Scalars['Float']['output'];
  minDuration: Scalars['Float']['output'];
  nodeId: Scalars['ID']['output'];
  nodeType: Scalars['String']['output'];
  successRate: Scalars['Float']['output'];
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
  duration?: Maybe<Scalars['Float']['output']>;
  endTime?: Maybe<Scalars['Float']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executionId: Scalars['ID']['output'];
  inputs?: Maybe<Scalars['JSON']['output']>;
  nodeId: Scalars['String']['output'];
  nodeType: Scalars['String']['output'];
  outputs?: Maybe<Scalars['JSON']['output']>;
  startTime: Scalars['Float']['output'];
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
  serviceConnectors?: Maybe<Scalars['JSON']['output']>;
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
  credential?: Maybe<CredentialWithData>;
  credentialTypes: Array<CredentialType>;
  credentials: Array<Credential>;
  executionSummary?: Maybe<ExecutionSummary>;
  executionTimeline: Array<ExecutionTimelineItem>;
  getAgentTypes: AgentTypeInfo;
  getChatStatus: ChatStatus;
  health: SystemStatus;
  introspectAgentTypes?: Maybe<AgentTypeInfo>;
  mcpServer?: Maybe<McpServer>;
  mcpServers: Array<McpServer>;
  mcpStatus: ProviderStatus;
  mcpTools: McpToolsResponse;
  n8nStatus: ProviderStatus;
  nodePerformanceMetrics: Array<NodePerformance>;
  nodeTraces: Array<NodeTrace>;
  nodeTypes: Array<NodeType>;
  ping: Scalars['String']['output'];
  queueMetrics: Array<QueueMetrics>;
  registryDashboard: RegistryDashboard;
  systemPerformanceMetrics: SystemPerformanceMetrics;
  workflow?: Maybe<Workflow>;
  workflowExecution?: Maybe<WorkflowExecution>;
  workflowExecutions: Array<WorkflowExecution>;
  workflowPerformanceOverview?: Maybe<WorkflowPerformanceOverview>;
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
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNodeTracesArgs = {
  executionId: Scalars['ID']['input'];
  nodeId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkflowExecutionArgs = {
  executionId: Scalars['ID']['input'];
};


export type QueryWorkflowExecutionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  workflowId: Scalars['ID']['input'];
};


export type QueryWorkflowPerformanceOverviewArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  workflowId: Scalars['ID']['input'];
};

export type Questions = BaseEvent & {
  __typename?: 'Questions';
  chatId: Scalars['ID']['output'];
  component?: Maybe<ComponentSpec>;
  conversationId: Scalars['ID']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type QueueMetrics = {
  __typename?: 'QueueMetrics';
  active: Scalars['Int']['output'];
  avgProcessingTime: Scalars['Float']['output'];
  completed: Scalars['Int']['output'];
  delayed: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  paused: Scalars['Int']['output'];
  throughput: Scalars['Float']['output'];
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
};


export type SubscriptionAiResultArgs = {
  conversationId: Scalars['ID']['input'];
};

export type SystemHealth = {
  __typename?: 'SystemHealth';
  services: Scalars['JSON']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type SystemMetrics = {
  __typename?: 'SystemMetrics';
  cpuUsage: Scalars['Float']['output'];
  memoryUsage: Scalars['Float']['output'];
  redisConnections: Scalars['Int']['output'];
  redisMemory: Scalars['String']['output'];
  redisOps: Scalars['Int']['output'];
  workerCount: Scalars['Int']['output'];
};

export type SystemPerformanceMetrics = {
  __typename?: 'SystemPerformanceMetrics';
  health: HealthStatus;
  queues: Array<QueueMetrics>;
  system: SystemMetrics;
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

export type TriggeredSignal = {
  __typename?: 'TriggeredSignal';
  signal: Scalars['String']['output'];
  targetNode: Scalars['String']['output'];
};

export type Workflow = {
  __typename?: 'Workflow';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  edges: Scalars['JSON']['output'];
  executionMode?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isCached: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  nodes: Scalars['JSON']['output'];
  testInputs?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type WorkflowContext = {
  __typename?: 'WorkflowContext';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  variables: Scalars['JSON']['output'];
};

export type WorkflowControlResult = {
  __typename?: 'WorkflowControlResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type WorkflowExecution = {
  __typename?: 'WorkflowExecution';
  cacheMetadata?: Maybe<CacheMetadata>;
  completedAt?: Maybe<Scalars['String']['output']>;
  executionId: Scalars['ID']['output'];
  result?: Maybe<Scalars['JSON']['output']>;
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  wasFromCache: Scalars['Boolean']['output'];
  workflowId: Scalars['ID']['output'];
};

export type WorkflowExecutionUpdate = {
  __typename?: 'WorkflowExecutionUpdate';
  activeNodes: Array<Scalars['String']['output']>;
  completedNodes: Scalars['JSON']['output'];
  executionId: Scalars['String']['output'];
  pendingSignals: Scalars['JSON']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  workflowId: Scalars['String']['output'];
  workflowStatus: Scalars['String']['output'];
};

export type WorkflowInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  edges: Scalars['JSON']['input'];
  executionMode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  nodes: Scalars['JSON']['input'];
  testInputs?: InputMaybe<Scalars['JSON']['input']>;
};

export type WorkflowPerformanceOverview = {
  __typename?: 'WorkflowPerformanceOverview';
  averageDuration?: Maybe<Scalars['Float']['output']>;
  failedExecutions: Scalars['Int']['output'];
  maxDuration?: Maybe<Scalars['Float']['output']>;
  medianDuration?: Maybe<Scalars['Float']['output']>;
  minDuration?: Maybe<Scalars['Float']['output']>;
  p95Duration?: Maybe<Scalars['Float']['output']>;
  successRate: Scalars['Float']['output'];
  successfulExecutions: Scalars['Int']['output'];
  totalExecutions: Scalars['Int']['output'];
};

export type TalkToAgentMutationVariables = Exact<{
  input: AgentInput;
}>;


export type TalkToAgentMutation = { __typename?: 'Mutation', talkToAgent: { __typename?: 'AgentResponse', chatId: string, conversationId: string, userId: string, executionId?: string | null, providerId?: string | null, success: boolean, message?: string | null } };

export type DebugNodeMutationVariables = Exact<{
  workflowId: Scalars['ID']['input'];
  nodeId: Scalars['String']['input'];
  executionId: Scalars['ID']['input'];
  conversationId: Scalars['String']['input'];
}>;


export type DebugNodeMutation = { __typename?: 'Mutation', debugNode: { __typename?: 'DebugNodeResult', success: boolean, error?: string | null, executionId?: string | null } };

export type GetChatStatusQueryVariables = Exact<{
  chatId: Scalars['ID']['input'];
}>;


export type GetChatStatusQuery = { __typename?: 'Query', getChatStatus: { __typename?: 'ChatStatus', exists: boolean, status?: string | null, startTime?: string | null, message?: string | null, error?: string | null } };

export type InvokeNodeInteractionMutationVariables = Exact<{
  input: NodeInteractionInput;
}>;


export type InvokeNodeInteractionMutation = { __typename?: 'Mutation', invokeNodeInteraction: { __typename?: 'NodeInteractionResult', success: boolean, data?: any | null, error?: string | null, jobId?: string | null, progress?: number | null } };
