import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = getDb();

    // Get or create default user profile (id = 1)
    let profile = db
      .prepare("SELECT * FROM user_profiles WHERE id = 1")
      .get() as
      | {
          id: number;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (!profile) {
      db.prepare(
        "INSERT INTO user_profiles (id, name, avatar_url) VALUES (1, '', NULL)",
      ).run();
      profile = {
        id: 1,
        name: "",
        avatar_url: null,
        created_at: "",
        updated_at: "",
      };
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error getting user profile:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, avatar_url } = body;

    const db = getDb();

    // Get or create default user profile (id = 1)
    const existingProfile = db
      .prepare("SELECT id FROM user_profiles WHERE id = 1")
      .get() as { id: number } | undefined;

    if (!existingProfile) {
      db.prepare(
        "INSERT INTO user_profiles (id, name, avatar_url) VALUES (1, ?, ?)",
      ).run(name || "", avatar_url || null);
    } else {
      db.prepare(
        "UPDATE user_profiles SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
      ).run(name || "", avatar_url || null);
    }

    const updatedProfile = db
      .prepare("SELECT * FROM user_profiles WHERE id = 1")
      .get() as {
      id: number;
      name: string;
      avatar_url: string | null;
      created_at: string;
      updated_at: string;
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}
