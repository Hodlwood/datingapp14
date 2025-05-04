import { NextResponse } from 'next/server';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export async function GET() {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const batch = writeBatch(db);
    let count = 0;

    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        test: true,
        updatedAt: new Date().toISOString()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      return NextResponse.json({ 
        success: true, 
        message: `Marked ${count} profiles as test data` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'No profiles found to update' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error marking test profiles:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 