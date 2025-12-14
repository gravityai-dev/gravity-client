/**
 * Message handlers for incoming WebSocket messages
 */

import type {
  ServerMessage,
  ComponentInitMessage,
  ComponentDataMessage,
  ComponentRemoveMessage,
  WorkflowStateMessage,
} from "../../../core/types";
import type { AudioState } from "../../../realtime/types";
import type { MessageHandlerContext } from "./types";
import { generateChatId } from "./helpers";
import { useAIContext } from "../../store/aiContext";

// =============================================================================
// MAIN ROUTER
// =============================================================================

/**
 * Route incoming server messages to appropriate handlers
 */
export function handleServerMessage(data: ServerMessage, ws: WebSocket, ctx: MessageHandlerContext): void {
  // Cast to any for switch since audioState isn't in ServerMessage type yet
  switch ((data as any).type) {
    case "SESSION_READY":
      handleSessionReady(ws, ctx);
      break;

    case "COMPONENT_INIT":
      handleComponentInit(data as ComponentInitMessage, ctx);
      break;

    case "COMPONENT_DATA":
      handleComponentData(data as ComponentDataMessage, ctx);
      break;

    case "COMPONENT_REMOVE":
      handleComponentRemove(data as ComponentRemoveMessage, ctx);
      break;

    case "WORKFLOW_STATE":
      handleWorkflowState(data as WorkflowStateMessage, ctx);
      break;

    case "AUDIO_STATE":
      handleAudioState(data, ctx);
      break;

    default:
      // Ignore unknown message types (PONG, etc.)
      break;
  }
}

// =============================================================================
// INDIVIDUAL HANDLERS
// =============================================================================

/**
 * Session is ready - send initial query if provided
 */
function handleSessionReady(ws: WebSocket, ctx: MessageHandlerContext): void {
  console.log("[WS] Session ready");
  ctx.setIsReady(true);

  const { sessionParams } = ctx;

  if (sessionParams.initialQuery) {
    console.log("[WS] Sending initial query:", sessionParams.initialQuery);
    const chatId = sessionParams.chatId || generateChatId();

    ws.send(
      JSON.stringify({
        type: "USER_ACTION",
        action: "send_message",
        data: {
          message: sessionParams.initialQuery,
          chatId,
          workflowId: sessionParams.workflowId,
          targetTriggerNode: sessionParams.targetTriggerNode,
        },
      })
    );
  }
}

/**
 * New component initialized - add to Zustand store
 */
function handleComponentInit(msg: ComponentInitMessage, ctx: MessageHandlerContext): void {
  if (!msg.chatId) {
    console.error("[WS] ❌ COMPONENT_INIT missing chatId");
    return;
  }

  console.log("[WS] 🚀 COMPONENT_INIT:", msg.component.type, msg.nodeId);
  ctx.initComponent(msg.chatId, msg.nodeId, msg.component.type);

  // If props included, update store immediately
  if (msg.component.props && Object.keys(msg.component.props).length > 0) {
    ctx.updateComponentData(msg.chatId, msg.nodeId, msg.component.props);
  }

  ctx.setEvents((prev) => [...prev, { ...msg, id: `${msg.nodeId}_${Date.now()}` }]);
}

/**
 * Component data update - update Zustand store
 */
function handleComponentData(msg: ComponentDataMessage, ctx: MessageHandlerContext): void {
  if (!msg.chatId) {
    console.error("[WS] ❌ COMPONENT_DATA missing chatId");
    return;
  }
  ctx.updateComponentData(msg.chatId, msg.nodeId, msg.data);
}

/**
 * Component removed - remove from Zustand store
 */
function handleComponentRemove(msg: ComponentRemoveMessage, ctx: MessageHandlerContext): void {
  if (!msg.chatId) {
    console.error("[WS] ❌ COMPONENT_REMOVE missing chatId");
    return;
  }
  console.log("[WS] 🗑️ REMOVE:", msg.component.type, msg.nodeId);
  ctx.removeComponent(msg.chatId, msg.nodeId);
}

/**
 * Workflow state change - update Zustand and emit event
 */
function handleWorkflowState(msg: WorkflowStateMessage, ctx: MessageHandlerContext): void {
  console.log(`[WS] 🔄 WORKFLOW_STATE: ${msg.state}`, {
    chatId: msg.chatId,
    workflowId: msg.workflowId,
    workflowRunId: msg.workflowRunId,
  });

  ctx.setWorkflowState(msg.state, msg.workflowId, msg.workflowRunId);

  ctx.setEvents((prev) => [...prev, { ...msg, id: `${msg.state}_${msg.chatId}_${msg.workflowRunId}` }]);
}

/**
 * Audio state change - update Zustand store and emit event for templates
 */
function handleAudioState(msg: any, ctx: MessageHandlerContext): void {
  console.log(`[WS] 🔊 AUDIO_STATE: ${msg.state}`, msg);

  // Update Zustand store with audio state (auto-updates speaking states)
  const { setAudioState } = useAIContext.getState();
  setAudioState(msg.state as AudioState);

  // Call the audio state callback if provided
  if (ctx.onAudioState) {
    ctx.onAudioState(msg.state, msg.metadata);
  }

  // Emit as event so templates can react
  ctx.setEvents((prev) => [...prev, { ...msg, id: `audioState_${msg.state}_${Date.now()}` }]);
}
