import { verifyToken } from "@/lib/jwt";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { path: pathParams } = await params;
    const filename = pathParams.join("/");

    if (filename.includes("..")) {
        return new NextResponse("Invalid path", { status: 400 });
    }

    const filePath = path.join(
        process.cwd(),
        "src",
        "private",
        "images",
        "tutoriels",
        filename
    );

    try {
        if (!fs.existsSync(filePath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let contentType = "application/octet-stream";

        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".webp") contentType = "image/webp";
        else if (ext === ".gif") contentType = "image/gif";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Error serving admin image:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
