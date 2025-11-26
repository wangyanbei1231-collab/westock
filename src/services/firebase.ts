import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚠️⚠️⚠️ 请将下方内容替换为您在 Firebase 控制台 (Project settings) 获取的真实配置
const firebaseConfig = {
apiKey: "AIzaSyCRgEDVu_nwd7k9Qv2uOkz9Gj-5inf0Txw",
  authDomain: "westock-app-89672.firebaseapp.com",
  projectId: "westock-app-89672",
  storageBucket: "westock-app-89672.firebasestorage.app",
  messagingSenderId: "206494601184",
  appId: "1:206494601184:web:a26a8b899f6307de00a585"
};


// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 导出认证和数据库实例
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
