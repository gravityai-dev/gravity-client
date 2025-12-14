/**
 * TemplateRenderer - Universal template rendering component
 *
 * Renders any Gravity template with the standard client context.
 * Uses a single Shadow DOM for the template and all its child components.
 */

import React from "react";
import { ComponentRenderer } from "../ComponentRenderer";
import { useAudioContext } from "./useAudioContext";
import { useClientContext } from "./useClientContext";
import type { TemplateRendererProps } from "./types";

export function TemplateRenderer({
  template,
  templateStack,
  history,
  historyManager,
  sendUserAction,
  sendAgentMessage,
  sendVoiceCallMessage,
  sessionParams,
  wsUrl,
  templateProps,
  onStateChange,
  onAction,
  sendAudio,
  playAudioRef,
  audioStateCallbackRef,
  sendMessage,
}: TemplateRendererProps): JSX.Element | null {
  // Audio context (capture, playback, state tracking)
  const audioContext = useAudioContext({
    sendAudio,
    playAudioRef,
    audioStateCallbackRef,
    sendMessage,
  });

  // Client context for templates
  const clientContext = useClientContext({
    history,
    historyManager,
    sendUserAction,
    sendAgentMessage,
    sendVoiceCallMessage,
    sessionParams,
    wsUrl,
    audioContext,
  });

  // Early return if no template (after all hooks are called)
  if (!template && (!templateStack || templateStack.length === 0)) {
    return null;
  }

  // If we have a template stack, render all templates as layers
  if (templateStack && templateStack.length > 0) {
    return (
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {templateStack.map((tmpl, index) => {
          const isTop = index === templateStack.length - 1;
          return (
            <div
              key={`${tmpl.name}-${index}`}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: index * 10,
                pointerEvents: isTop ? "auto" : "none",
              }}
            >
              <ComponentRenderer
                component={{
                  Component: tmpl.Component,
                  name: tmpl.name,
                  nodeId: tmpl.nodeId,
                  props: {
                    ...tmpl.props,
                    ...templateProps,
                    client: clientContext,
                    onStateChange: onStateChange,
                    onAction: onAction,
                  },
                }}
                onAction={onAction}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: single template (backward compatibility)
  if (!template) return null;

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <ComponentRenderer
        key={template.name}
        component={{
          Component: template.Component,
          name: template.name,
          nodeId: template.nodeId,
          props: {
            ...template.props,
            ...templateProps,
            client: clientContext,
            onStateChange: onStateChange,
          },
        }}
        onAction={onAction}
      />
    </div>
  );
}

export default TemplateRenderer;
