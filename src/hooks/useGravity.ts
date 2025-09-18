/**
 * Main hook for accessing Gravity AI functionality
 */

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGravityStore } from "../store";

export function useGravity() {
  const gravityState = useGravityStore(
    useShallow((state) => {
      return {
        // Connection slice
        client: state.client,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        connect: state.connect,
        disconnect: state.disconnect,
        cleanupSubscription: state.cleanupSubscription,
        updateSubscription: state.updateSubscription,

        // Conversation slice
        conversationId: state.conversationId,
        messages: state.messages,
        sendMessage: state.sendMessage,
        clearConversation: state.clearConversation,
        
        // Audio state from response slice
        audioState: state.audioState,

        // Response slice
        chatId: state.chatId,
        userId: state.userId,
        messageSource: state.messageSource,
        messageChunks: state.messageChunks,
        audioChunks: state.audioChunks,
        progressUpdate: state.progressUpdate,
        jsonData: state.jsonData,
        actionSuggestion: state.actionSuggestion,
        text: state.text,
        cards: state.cards,
        questions: state.questions,
        nodeExecutionEvent: state.nodeExecutionEvent,
        startTime: state.startTime,
        endTime: state.endTime,
        startActiveResponse: state.startActiveResponse,
        processMessage: state.processMessage,
        completeActiveResponse: state.completeActiveResponse,
        clearActiveResponse: state.clearActiveResponse,

        // UI slice
        sidebarOpen: state.sidebarOpen,
        sidebarMode: state.sidebarMode,
        componentConfig: state.componentConfig,
        toggleSidebar: state.toggleSidebar,
        setSidebarMode: state.setSidebarMode,
        setComponentConfig: state.setComponentConfig,
        workflowId: state.workflowId,
        workflowRunId: state.workflowRunId,
        appState: state.appState,
        isProcessing: state.isProcessing,
        setWorkflowState: state.setWorkflowState,
        updateAppState: state.updateAppState,
        resetWorkflow: state.resetWorkflow,
        form: state.form,
        setForm: state.setForm,
      };
    })
  );

  // Note: We do NOT cleanup subscriptions on unmount because:
  // 1. Subscriptions should persist across component lifecycles
  // 2. The subscription is tied to the conversation ID, not component lifecycle
  // 3. Cleanup should only happen when explicitly changing conversations or disconnecting

  return gravityState;
}
