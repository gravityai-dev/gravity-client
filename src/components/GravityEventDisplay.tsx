/**
 * Simple component to display GravityEvents
 */

import React from "react";
import { useGravityStore } from "../store";

interface GravityEventDisplayProps {
  conversationId: string;
}

export function GravityEventDisplay({ conversationId }: GravityEventDisplayProps) {
  // For now, just show a placeholder since we haven't set up gravity event storage
  const isConnected = useGravityStore((state: any) => state.isConnected);
  const events: any[] = []; // Placeholder until we add gravity event storage

  return (
    <div className="gravity-events">
      <div className="connection-status">
        {isConnected && <span>✅ Connected</span>}
        {!isConnected && <span>❌ Disconnected</span>}
      </div>

      <div className="events-list">
        {events.map((event: any) => (
          <div key={event.id} className="event-item">
            <div className="event-header">
              <span className="event-type">{event.eventType}</span>
              <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="event-content">
              {renderEventContent(event)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderEventContent(event: any) {
  switch (event.eventType) {
    case "text":
      return <p>{event.data.text}</p>;
    
    case "progress":
      return (
        <div className="progress">
          <span>{event.data.message}</span>
          <progress value={event.data.progress} max={100} />
        </div>
      );
    
    case "card":
      return (
        <div className="card">
          <h3>{event.data.title}</h3>
          <p>{event.data.content}</p>
        </div>
      );
    
    case "json":
      return (
        <pre>{JSON.stringify(event.data.data, null, 2)}</pre>
      );
    
    default:
      return <pre>{JSON.stringify(event.data, null, 2)}</pre>;
  }
}
