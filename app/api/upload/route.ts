import { auth } from "@clerk/nextjs/server"
import { api } from "@/convex/_generated/api"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf']

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // // Check user's storage billing
    // const billing = await fetchQuery(api.billing.getUserBilling, { userId });
    // if (!billing) {
    //   // Initialize billing for new users
    //   await fetchMutation(api.billing.initializeUserBilling, { userId });
    // }

    // const currentBilling = billing || await fetchQuery(api.billing.getUserBilling, { userId });
    // if (!currentBilling) {
    //   return NextResponse.json({ error: "Failed to check storage limits" }, { status: 500 });
    // }

    // Calculate total size of files being uploaded
    // const totalUploadSize = files.reduce((total, file) => total + file.size, 0);

    // // Check if user has enough storage
    // if (currentBilling.storageUsed + totalUploadSize > currentBilling.storageLimit) {
    //   return NextResponse.json(
    //     { 
    //       error: "Insufficient storage space",
    //       storageNeeded: totalUploadSize,
    //       storageAvailable: currentBilling.storageLimit - currentBilling.storageUsed,
    //       currentUsage: currentBilling.storageUsed,
    //       limit: currentBilling.storageLimit
    //     },
    //     { status: 413 } // Payload Too Large
    //   );
    // }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        )
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} must be a PDF` },
          { status: 400 }
        )
      }
    }

    const uploadedFiles = []

    for (const file of files) {
      try {
        // Generate upload URL from Convex
        const uploadUrl = await fetchMutation(api.files.generateUploadUrl, {})

        // Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!result.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const { storageId } = await result.json()

        // Save file metadata to database
        const fileId = await fetchMutation(api.files.saveFile, {
          storageId,
          name: file.name,
          size: file.size,
          type: file.type,
          userId,
        })

        // // Record storage usage
        // try {
        //   await fetchMutation(api.billing.recordStorageUsage, {
        //     userId,
        //     sizeBytes: file.size,
        //     fileId,
        //     operationType: "file_upload",
        //     filename: file.name,
        //   });
        // } catch (billingError) {
        //   console.error(`Error recording storage usage for ${file.name}:`, billingError);
        //   // Don't fail the upload if billing fails, but log it
        // }

        uploadedFiles.push({
          fileId,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 }
        )
      }
    }

    // Get download URLs for the uploaded files
    const fileIds = uploadedFiles.map(f => f.fileId)
    const downloadUrls = await fetchQuery(api.files.getDownloadUrls, { fileIds })

    return NextResponse.json({
      success: true,
      files: downloadUrls,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}