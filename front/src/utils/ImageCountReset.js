// src/utils/imageCountReset.js
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function checkAndResetImageCount(userId) {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    const lastUpdated = data.lastUpdated ? data.lastUpdated.toDate() : null;
    const now = new Date();

    // 마지막 업데이트가 없거나 다른 날짜인 경우 리셋
    if (!lastUpdated || !isSameDay(lastUpdated, now)) {
      await setDoc(userDocRef, {
        imageCount: 0,
        lastUpdated: now
      }, { merge: true });
      console.log("이미지 카운트가 리셋되었습니다.");
      return true; // 리셋됨
    }
  } else {
    // 사용자 문서가 없으면 새로 생성
    await setDoc(userDocRef, {
      imageCount: 0,
      lastUpdated: new Date()
    });
    console.log("새 사용자 문서가 생성되었습니다.");
    return true; // 새로 생성됨
  }

  return false; // 리셋되지 않음
}

// 두 날짜가 같은 날인지 확인하는 헬퍼 함수
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}