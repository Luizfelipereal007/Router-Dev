import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = getDb();

    const accounts = db
      .prepare("SELECT * FROM linked_accounts ORDER BY linked_at DESC")
      .all() as Array<{
      id: number;
      user_id: number;
      provider: "github" | "gitlab";
      provider_username: string;
      provider_avatar_url: string | null;
      linked_at: string;
    }>;

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error getting linked accounts:", error);
    return NextResponse.json(
      { error: "Failed to get linked accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, provider_username, provider_avatar_url } = body;

    if (!provider || !provider_username) {
      return NextResponse.json(
        { error: "Provider and username are required" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Get or create default user profile (id = 1)
    const existingProfile = db
      .prepare("SELECT id FROM user_profiles WHERE id = 1")
      .get() as { id: number } | undefined;
    if (!existingProfile) {
      db.prepare(
        "INSERT INTO user_profiles (id, name, avatar_url) VALUES (1, '', NULL)",
      ).run();
    }

    try {
      const result = db
        .prepare(
          "INSERT INTO linked_accounts (user_id, provider, provider_username, provider_avatar_url) VALUES (1, ?, ?, ?)",
        )
        .run(provider, provider_username, provider_avatar_url || null);

      const account = db
        .prepare("SELECT * FROM linked_accounts WHERE id = ?")
        .get(result.lastInsertRowid) as {
        id: number;
        user_id: number;
        provider: "github" | "gitlab";
        provider_username: string;
        provider_avatar_url: string | null;
        linked_at: string;
      };

      return NextResponse.json(account, { status: 201 });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        // Update existing account
        db.prepare(
          "UPDATE linked_accounts SET provider_avatar_url = ?, linked_at = CURRENT_TIMESTAMP WHERE user_id = 1 AND provider = ? AND provider_username = ?",
        ).run(provider_avatar_url || null, provider, provider_username);

        const account = db
          .prepare(
            "SELECT * FROM linked_accounts WHERE user_id = 1 AND provider = ? AND provider_username = ?",
          )
          .get(provider, provider_username) as {
          id: number;
          user_id: number;
          provider: "github" | "gitlab";
          provider_username: string;
          provider_avatar_url: string | null;
          linked_at: string;
        };

        return NextResponse.json(account);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating linked account:", error);
    return NextResponse.json(
      { error: "Failed to create linked account" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const provider = searchParams.get("provider");
    const username = searchParams.get("username");

    if (!id && !(provider && username)) {
      return NextResponse.json(
        { error: "ID or provider+username is required" },
        { status: 400 },
      );
    }

    const db = getDb();

    let result: { changes: number };
    if (id) {
      result = db
        .prepare("DELETE FROM linked_accounts WHERE id = ?")
        .run(Number(id));
    } else {
      result = db
        .prepare(
          "DELETE FROM linked_accounts WHERE user_id = 1 AND provider = ? AND provider_username = ?",
        )
        .run(provider, username);
    }

    if (result.changes === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Also remove projects from this provider
    if (provider) {
      db.prepare(
        "UPDATE projects SET git_provider = NULL WHERE git_provider = ?",
      ).run(provider);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting linked account:", error);
    return NextResponse.json(
      { error: "Failed to delete linked account" },
      { status: 500 },
    );
  }
}
