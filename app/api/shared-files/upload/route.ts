import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { ALLOWED_CONTENT_TYPES, MAX_SHARED_FILE_BYTES, blobPrefixFor } from "@/lib/sharedFiles";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";

export const dynamic = "force-dynamic";

// Gives the browser a short-lived permission to upload one file straight to
// storage (so files can be bigger than a normal request allows). Only a signed-in
// Premium account, only PDF/JPG/PNG, only up to the size limit, and only into its
// own folder. The file is checked again when it is attached to a link.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });
    const userId = session.user.id;
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(blobPrefixFor(userId))) throw new Error("Not allowed");
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SHARED_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Shared file upload token failed:", err);
    return NextResponse.json({ error: "The upload did not work. Please try again." }, { status: 400 });
  }
}
