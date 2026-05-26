import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate SHA256 Hash
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const hexHash = hashSum.digest('hex');
    const hashWithPrefix = '0x' + hexHash;

    // Upload to Pinata IPFS
    const pinataData = new FormData();
    pinataData.append('file', file);
    
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
      },
      body: pinataData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error("Pinata Error:", errorText);
      throw new Error("Failed to upload to IPFS via Pinata");
    }

    const pinataResult = await pinataResponse.json();
    const realCid = pinataResult.IpfsHash;

    return NextResponse.json({
      success: true,
      hash: hashWithPrefix,
      cid: realCid,
      message: "File successfully hashed and pinned to IPFS!"
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
