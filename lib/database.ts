// Lazy initialization of database connection
let sql: any = null
let initialized = false

function getDbConnection() {
  if (!initialized) {
    initialized = true
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = require("@neondatabase/serverless")
        sql = neon(process.env.DATABASE_URL)
      } catch (error) {
        console.warn("Failed to initialize database connection:", error)
      }
    }
  }
  return sql
}

export interface Conversation {
  id: string
  user_id?: string
  title?: string
  created_at: Date
  updated_at: Date
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface UsageAnalytics {
  id: string
  session_id?: string
  provider?: string
  model?: string
  tokens_used?: number
  processing_time_ms?: number
  success?: boolean
  error_message?: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface SystemSetting {
  id: string
  key: string
  value: any
  description?: string
  created_at: Date
  updated_at: Date
}

// Database operations
export class DrXDatabase {
  private static ensureConnection() {
    const db = getDbConnection()
    if (!db) {
      throw new Error("Database connection not available. DATABASE_URL environment variable is required.")
    }
    return db
  }

  // Conversations
  static async createConversation(data: Partial<Conversation>): Promise<Conversation> {
    const db = this.ensureConnection()
    const [conversation] = await db`
      INSERT INTO conversations (user_id, title, metadata)
      VALUES (${data.user_id || null}, ${data.title || null}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `
    return conversation as Conversation
  }

  static async getConversation(id: string): Promise<Conversation | null> {
    const db = this.ensureConnection()
    const [conversation] = await db`
      SELECT * FROM conversations WHERE id = ${id}
    `
    return (conversation as Conversation) || null
  }

  static async getRecentConversations(userId?: string, limit = 10) {
    const db = this.ensureConnection()
    return await db`
      SELECT * FROM get_recent_conversations(${userId || null}, ${limit})
    `
  }

  static async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const db = this.ensureConnection()
    const [conversation] = await db`
      UPDATE conversations
      SET title = COALESCE(${data.title}, title),
          metadata = COALESCE(${JSON.stringify(data.metadata)}, metadata),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return conversation as Conversation
  }

  static async deleteConversation(id: string): Promise<boolean> {
    const db = this.ensureConnection()
    const result = await db`
      DELETE FROM conversations WHERE id = ${id}
    `
    return result.count > 0
  }

  // Messages
  static async createMessage(data: Omit<Message, "id" | "created_at">): Promise<Message> {
    const db = this.ensureConnection()
    const [message] = await db`
      INSERT INTO messages (conversation_id, role, content, metadata)
      VALUES (${data.conversation_id}, ${data.role}, ${data.content}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `
    return message as Message
  }

  static async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const db = this.ensureConnection()
    return (await db`
      SELECT * FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT ${limit}
    `) as Message[]
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const db = this.ensureConnection()
    const result = await db`
      DELETE FROM messages WHERE id = ${id}
    `
    return result.count > 0
  }

  // Usage Analytics
  static async logUsage(data: Omit<UsageAnalytics, "id" | "created_at">): Promise<UsageAnalytics> {
    const db = this.ensureConnection()
    const [usage] = await db`
      INSERT INTO usage_analytics (
        session_id, provider, model, tokens_used,
        processing_time_ms, success, error_message, metadata
      )
      VALUES (
        ${data.session_id || null}, ${data.provider || null}, ${data.model || null},
        ${data.tokens_used || 0}, ${data.processing_time_ms || 0},
        ${data.success !== false}, ${data.error_message || null},
        ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `
    return usage as UsageAnalytics
  }

  static async getUsageStats(daysBack = 7) {
    const db = this.ensureConnection()
    return await db`
      SELECT * FROM get_usage_stats(${daysBack})
    `
  }

  // System Settings
  static async getSetting(key: string): Promise<any> {
    const db = this.ensureConnection()
    const [setting] = await db`
      SELECT value FROM system_settings WHERE key = ${key}
    `
    return setting?.value || null
  }

  static async setSetting(key: string, value: any, description?: string): Promise<SystemSetting> {
    const db = this.ensureConnection()
    const [setting] = await db`
      INSERT INTO system_settings (key, value, description)
      VALUES (${key}, ${JSON.stringify(value)}, ${description || null})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        updated_at = NOW()
      RETURNING *
    `
    return setting as SystemSetting
  }

  static async getAllSettings(): Promise<SystemSetting[]> {
    const db = this.ensureConnection()
    return (await db`
      SELECT * FROM system_settings ORDER BY key
    `) as SystemSetting[]
  }

  // Utility functions
  static async healthCheck(): Promise<boolean> {
    try {
      const db = getDbConnection()
      if (!db) {
        return false
      }
      await db`SELECT 1`
      return true
    } catch (error) {
      console.error("Database health check failed:", error)
      return false
    }
  }

  static async cleanupOldData(daysToKeep = 30): Promise<number> {
    const db = this.ensureConnection()
    const [result] = await db`
      SELECT cleanup_old_data(${daysToKeep}) as deleted_count
    `
    return result.deleted_count || 0
  }
}

export { getDbConnection as sql }
export default DrXDatabase
