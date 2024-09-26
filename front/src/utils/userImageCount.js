import { db } from '../firebase/config';
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

const MAX_IMAGE_COUNT = 10; // 하루 최대 생성 가능한 이미지 수

export async function getUserImageCount(userId) {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return data.imageCount || 0;
  } else {
    // 사용자 문서가 없으면 새로 생성
    await setDoc(userDocRef, { imageCount: 0 });
    return 0;
  }
}

export async function incrementUserImageCount(userId) {
  const userDocRef = doc(db, "users", userId);
  
  await setDoc(userDocRef, { 
    imageCount: increment(1),
    lastUpdated: new Date()
  }, { merge: true });
}

export async function canCreateImage(userId) {
  const count = await getUserImageCount(userId);
  return count < MAX_IMAGE_COUNT;
}

export async function resetUserImageCount(userId) {
  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, { 
    imageCount: 0,
    lastUpdated: new Date()
  }, { merge: true });
}