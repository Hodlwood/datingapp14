import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket?: string;
}

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Check for required environment variables
    const config: FirebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    };

    if (!config.projectId || !config.clientEmail || !config.privateKey) {
      throw new Error('Missing required Firebase Admin environment variables');
    }

    // Clean up the private key
    const privateKey = config.privateKey
      .replace(/\\n/g, '\n')  // Replace escaped newlines
      .replace(/"/g, '')      // Remove quotes
      .trim();                // Remove any extra whitespace

    // Initialize Firebase Admin with explicit project ID
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
    });

    console.log('Firebase Admin initialized successfully with project ID:', config.projectId);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Get Firebase Admin services
const auth = getAuth();
const storage = getStorage();
const bucket = storage.bucket();

interface UploadResponse {
  url: string;
  error?: never;
}

interface ErrorResponse {
  error: string;
  url?: never;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided or invalid file type' }, { status: 400 });
    }

    // Create a unique filename
    const filename = `${uid}/${Date.now()}-${file.name}`;

    // Upload the file to Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUpload = bucket.file(filename);
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Get the public URL
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 