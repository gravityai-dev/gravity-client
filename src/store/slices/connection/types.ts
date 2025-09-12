/**
 * Connection slice types
 */

import { ConnectionState } from "../../types";
import { ConnectionConfig } from "../../../types/config";

// Connection slice interface - flattened for easy access
export interface ConnectionSlice extends ConnectionState {
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  cleanupSubscription: () => void;
  updateSubscription: () => void;
}
