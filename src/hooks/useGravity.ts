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

        // Response slice  
        chatId: state.chatId,
        userId: state.userId,
        messageSource: state.messageSource,
        messageChunks: state.messageChunks,
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
        componentConfig: state.componentConfig,
        toggleSidebar: state.toggleSidebar,
        setComponentConfig: state.setComponentConfig,
        workflowId: state.workflowId,
        workflowRunId: state.workflowRunId,
        appState: state.appState,
        isProcessing: state.isProcessing,
        setWorkflowState: state.setWorkflowState,
        updateAppState: state.updateAppState,
        resetWorkflow: state.resetWorkflow,
      };
    })
  );

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      gravityState.cleanupSubscription();
    };
  }, [gravityState.cleanupSubscription]);

  return gravityState;
}
