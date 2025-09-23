import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = localStorage.getItem("session");
  if (userId == null || userId == "") {
    return NextResponse.json(
      { message: "No connected user." },
      { status: 400 }
    );
  }

  // Fetch from db
  if (userId === "123") {
    const userData = {
      id: "123",
      name: "John Doe",
      email: "john.doe@example.com",
    };
    return NextResponse.json(userData, { status: 200 });
  } else if (userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
}
