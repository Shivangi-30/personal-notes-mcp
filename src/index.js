
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";

// Create MCP Server
const server = new McpServer({
  name: "personal-notes-server",
  version: "1.0.0"
});

// Register first MCP Tool
server.registerTool(
  "add_note",
  {
    title: "Add Note",
    description: "Create and save a personal note",
    inputSchema: {
      title: z.string().describe("Note title"),
      content: z.string().describe("Note content")
      
    }
  },
  async ({ title, content }) => {
    const notes = JSON.parse(
      await fs.readFile("notes.json", "utf-8")
    );

    const newNote = {
      id: Date.now(),
      title,
      content,
      createdAt: new Date().toISOString()
    };

    notes.push(newNote);

    await fs.writeFile(
      "notes.json",
      JSON.stringify(notes, null, 2)
    );

    return {
      content: [
        {
          type: "text",
          text: `Note "${title}" created successfully!`
        }
      ]
    };
  }
);


server.registerTool(
  "get_notes",
  {
    title: "Get Notes",
    description: "Get all saved personal notes",
    inputSchema: {}
  },
  async () => {
    const notes = JSON.parse(
      await fs.readFile("notes.json", "utf-8")
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(notes, null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  "search_notes",
  {
    title: "Search Notes",
    description: "Search notes by title or content",
    inputSchema: {
      query: z.string().min(1).describe("Search keyword")
    }
  },
  async ({ query }) => {
    const notes = JSON.parse(
      await fs.readFile("notes.json", "utf-8")
    );

    const results = notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      );
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  "delete_note",
  {
    title: "Delete Note",
    description: "Delete a personal note using its ID",
    inputSchema: {
      id: z.number().describe("ID of the note to delete")
    }
  },
  async ({ id }) => {
    const notes = JSON.parse(
      await fs.readFile("notes.json", "utf-8")
    );

    const filteredNotes = notes.filter(
      (note) => note.id !== id
    );

    if (filteredNotes.length === notes.length) {
      return {
        content: [
          {
            type: "text",
            text: `No note found with ID ${id}`
          }
        ],
        isError: true
      };
    }

    await fs.writeFile(
      "notes.json",
      JSON.stringify(filteredNotes, null, 2)
    );

    return {
      content: [
        {
          type: "text",
          text: `Note with ID ${id} deleted successfully!`
        }
      ]
    };
  }
);


// Start server connection
const transport = new StdioServerTransport();

await server.connect(transport);
