// myFeature.ts
import { listTools, callTool } from './mcp.js'; // Adjust path if needed
import {    CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
async function doSomethingWithTools() {
    console.log("Doing something that requires the tools list...");
    const toolsResult = await listTools();

    if (toolsResult) {
        console.log(`Successfully retrieved ${toolsResult.tools.length} tools in myFeature.`);
        // ... process the tools ...
    } else {
        console.log("Could not retrieve tools in myFeature.");
    }
    const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'studentDetails',
          arguments: {
            studentId: 1003, // 1 second between notifications
          }
        }
      };

    const result = await callTool(request);
    if (result) {
        console.log(`Successfully called tool: ${JSON.stringify(result)}`);
    }

}

doSomethingWithTools();
