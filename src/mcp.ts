import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
    ListToolsRequest,
    ListToolsResultSchema,
    ListToolsResult,
    CallToolRequest,
    CallToolResultSchema,
    CallToolResult
} from "@modelcontextprotocol/sdk/types.js";

// --- Singleton State ---
let clientInstance: Client | undefined = undefined;
let connectionPromise: Promise<Client> | null = null;
const BASE_URL = "http://localhost:8081/sse"; // Use a constant for the URL

/**
 * Internal function to establish the actual connection.
 * Should only be called by getClient().
 */
async function connectInternal(): Promise<Client> {
    console.log("Attempting to establish connection...");
    // Create and assign the new client for SSE
    const client = new Client({
        name: 'singleton-sse-client', // Give it a descriptive name
        version: '1.0.0'
    });
    //const sseTransport = new SSEClientTransport(new URL(BASE_URL));

    /* 
    "command": "/home/davidmathias/opensource/github-mcp-server/github-mcp-server",
            "args": [
                "stdio"
            ],
            "env": {
                "GITHUB_PERSONAL_ACCESS_TOKEN": "xyzzz"
            }
    */
    const transport = new StdioClientTransport({
        command: "/home/davidmathias/opensource/github-mcp-server/github-mcp-server",
        args: ["stdio"],
        env: {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "dummy-10-16T20:23:14Z",
        }
      });
      
    try {
        await client.connect(transport);
        console.log("Connected using SSE transport");
        return client;
    } catch (error) {
        console.error("Connection failed:", error);
        // Rethrow the error to be handled by the caller (getClient)
        throw error;
    }
}

/**
 * Gets the singleton client instance.
 * Establishes connection if needed, or waits for an ongoing connection attempt.
 * Returns the connected client or throws an error if connection fails.
 */
export async function getClient(): Promise<Client> {
    // 1. Check if already connected and instance exists
    //    (Add more sophisticated checks like client.isConnected if available)
    if (clientInstance) {
        console.log("Returning existing connected client.");
        return clientInstance;
    }

    // 2. Check if a connection attempt is already in progress
    if (connectionPromise) {
        console.log("Connection attempt already in progress, waiting...");
        // Wait for the existing promise to resolve or reject
        return connectionPromise;
    }

    // 3. Initiate a new connection attempt
    console.log("Initiating new connection sequence.");
    connectionPromise = (async () => {
        try {
            const connectedClient = await connectInternal();
            clientInstance = connectedClient; // Store the successful instance
            // Keep connectionPromise non-null after success?
            // If we keep it, subsequent calls hit step 2 and return the promise,
            // which resolves to the instance. If we null it, they hit step 1.
            // Let's keep it simple and rely on step 1 for subsequent calls after success.
            // connectionPromise = null; // Optional: Reset promise after success
            return clientInstance;
        } catch (error) {
            clientInstance = undefined; // Clear instance on failure
            connectionPromise = null; // IMPORTANT: Allow retry on next call
            console.error("Connection sequence failed.");
            throw error; // Propagate the error
        }
    })(); // Immediately invoke the async IIFE

    return connectionPromise;
}

/**
 * Internal logic for listing tools, requires a connected client.
 */
async function _listToolsInternal(client: Client): Promise<ListToolsResult> {
    const toolsRequest: ListToolsRequest = {
        method: 'tools/list',
        params: {}
    };
    // Let errors propagate up to the public listTools function
    const toolsResult = await client.request(toolsRequest, ListToolsResultSchema);
    return toolsResult;
}

/**
 * Public function to list tools.
 * It ensures a connection is established (or reused) before making the request.
 * Handles retrieving the client internally.
 */
export async function listTools(): Promise<ListToolsResult | undefined> {
    try {
        console.log("listTools called. Getting client...");
        // Get the client instance (connects if necessary)
        const client = await getClient();

        console.log("Client obtained. Requesting tools list...");
        const result = await _listToolsInternal(client);

        // Log the results here (or return them for the caller to handle)
        console.log('Available tools:');
        if (!result || result.tools.length === 0) {
            console.log('  No tools available or result is empty.');
        } else {
            for (const tool of result.tools) {
                console.log(`  - ${tool.name}: ${tool.description}`);
            }
        }
        return result; // Return the actual result

    } catch (error) {
        // This catches errors from getClient() or _listToolsInternal()
        console.error(`Error during listTools sequence: ${error}`);
        // The connection state (clientInstance, connectionPromise) should have been
        // reset within getClient if the connection failed.
        return undefined; // Indicate failure as per previous logic
    }
}

export async function callTool(request: CallToolRequest): Promise<CallToolResult | undefined> {
    try {
      // Call the notification tool using reasonable defaults

      console.log('Calling notification tool...');
      const client = await getClient();
      const result = await client.request(request, CallToolResultSchema);

      return result;

    } catch (error) {
      console.log(`Error calling notification tool: ${error}`);
      return undefined; // Indicate failure
    }
  }